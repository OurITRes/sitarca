import json
import boto3
import xml.etree.ElementTree as ET
from datetime import datetime
from uuid import uuid4
import os

s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

# Environment variables
MAIN_TABLE_NAME = os.environ.get('MAIN_TABLE_NAME')
CURATED_BUCKET = os.environ.get('CURATED_BUCKET')

table = dynamodb.Table(MAIN_TABLE_NAME)


def handler(event, context):
    """
    Lambda handler triggered by S3 ObjectCreated event.
    Parses PingCastle XML, writes to DynamoDB and S3 curated.
    """
    print(f"Event received: {json.dumps(event)}")
    
    try:
        # Extract S3 event details (supports EventBridge and direct S3 notifications)
        processed = False
        
        # Case 1: EventBridge S3 event (top-level 'detail')
        if isinstance(event, dict) and 'detail' in event:
            bucket = event['detail']['bucket']['name']
            key = event['detail']['object']['key']
            processed = True
        
        # Case 2: Direct S3 event (Records array)
        elif isinstance(event, dict) and 'Records' in event:
            for record in event.get('Records', []):
                if 's3' in record:
                    bucket = record['s3']['bucket']['name']
                    key = record['s3']['object']['key']
                    processed = True
                else:
                    print(f"Unknown S3 record structure: {record}")
        
        if not processed:
            print("No recognizable S3 event structure found")
            return {
                'statusCode': 400,
                'body': json.dumps({'message': 'Bad event structure'})
            }
        
        print(f"Processing: s3://{bucket}/{key}")
        
        # Download XML from S3
        response = s3_client.get_object(Bucket=bucket, Key=key)
        xml_content = response['Body'].read().decode('utf-8')
        
        # Parse XML and process findings
        findings, generation_date, domain_fqdn = parse_pingcastle_xml(xml_content)
        
        if not findings:
            print("No findings found in XML")
            return {
                'statusCode': 204,
                'body': json.dumps({'message': 'No findings'})
            }
        
        # Write to DynamoDB
        write_to_dynamodb(findings, key, generation_date, domain_fqdn)
        
        # Write snapshot to S3 curated
        write_to_curated(findings, key, generation_date, domain_fqdn)
        
        print(f"Successfully processed {len(findings)} findings from {key}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Processing completed'})
        }
    
    except Exception as e:
        print(f"Error processing event: {str(e)}")
        raise


def parse_pingcastle_xml(xml_content):
    """
    Parse PingCastle XML and extract findings from RiskRules.
    Returns tuple: (list of finding dictionaries, generation_date string, domain_fqdn string).
    """
    findings = []
    generation_date = None
    domain_fqdn = None
    
    try:
        root = ET.fromstring(xml_content)
        
        # Extract GenerationDate from XML root
        generation_date_elem = root.find('.//GenerationDate')
        if generation_date_elem is not None and generation_date_elem.text:
            # Parse the ISO 8601 datetime string
            # Format: 2025-12-18T14:32:25.6874739-05:00
            generation_date = generation_date_elem.text
            print(f"Found GenerationDate: {generation_date}")
        else:
            # Fallback to current time if GenerationDate not found
            generation_date = datetime.utcnow().isoformat()
            print("Warning: GenerationDate not found in XML, using current time")
        
        # Extract DomainFQDN from XML root
        domain_elem = root.find('.//DomainFQDN')
        if domain_elem is not None and domain_elem.text:
            domain_fqdn = domain_elem.text
            print(f"Found DomainFQDN: {domain_fqdn}")
        else:
            print("Warning: DomainFQDN not found in XML")
        
        # Find RiskRules section
        risk_rules = root.find('.//RiskRules')
        if risk_rules is None:
            print("No RiskRules section found in XML")
            return findings, generation_date, domain_fqdn
        
        # Extract each HealthcheckRiskRule
        for rule in risk_rules.findall('HealthcheckRiskRule'):
            finding = {}
            
            # Extract required fields
            finding['riskId'] = get_element_text(rule, 'RiskId')
            finding['category'] = get_element_text(rule, 'Category')
            finding['model'] = get_element_text(rule, 'Model')
            finding['points'] = get_element_text(rule, 'Points')
            finding['rationale'] = get_element_text(rule, 'Rationale')
            
            # Optional fields
            finding['details'] = get_element_text(rule, 'Details')
            
            if finding['riskId']:
                findings.append(finding)
        
        print(f"Parsed {len(findings)} findings from XML")
        
    except ET.ParseError as e:
        print(f"XML parsing error: {str(e)}")
        raise
    
    return findings, generation_date, domain_fqdn


def get_element_text(parent, tag_name):
    """
    Safely extract text from XML element.
    """
    element = parent.find(tag_name)
    return element.text if element is not None and element.text else ''


def write_to_dynamodb(findings, s3_key, generation_date, domain_fqdn):
    """
    Write findings to DynamoDB with deduplication.
    Deduplication key: date + domain + riskId
    Structure:
    - Weakness: pk=WEAK#{riskId}#{domain}#{date}, sk=META
    - Evidence: pk=WEAK#{riskId}#{domain}#{date}, sk=EVID#{uuid}
    Uses generation_date from XML for all timestamps.
    """
    
    # Extract date from generation_date (YYYY-MM-DD)
    try:
        date_str = generation_date[:10]
    except Exception:
        date_str = datetime.utcnow().strftime('%Y-%m-%d')
    
    # Normalize domain (lowercase, remove trailing dot)
    domain_normalized = domain_fqdn.lower().rstrip('.') if domain_fqdn else 'unknown'
    
    for finding in findings:
        risk_id = finding['riskId']
        
        # Create composite primary key: date + domain + riskId
        # Example: WEAK#A-Krbtgt#labad.local#2025-12-18
        composite_pk = f"WEAK#{risk_id}#{domain_normalized}#{date_str}"
        
        # 1. Write/Update Weakness metadata (composite_pk / META)
        # Use UpdateItem with conditional expression to prevent overwrites if already exists
        weakness_item = {
            'pk': composite_pk,
            'sk': 'META',
            'riskId': risk_id,
            'category': finding['category'],
            'model': finding['model'],
            'source': 'pingcastle',
            'domain': domain_normalized,
            'date': date_str,
            'lastUpdated': generation_date
        }
        
        try:
            # Use put_item without condition - will update if already exists
            table.put_item(Item=weakness_item)
            print(f"Written/Updated weakness: {composite_pk}")
        except Exception as e:
            print(f"Error writing weakness {risk_id}: {str(e)}")
        
        # 2. Write Evidence (composite_pk / EVID#{uuid})
        # Use composite key in sort key too to ensure uniqueness per scan
        evidence_uuid = str(uuid4())
        evidence_item = {
            'pk': composite_pk,
            'sk': f"EVID#{evidence_uuid}",
            'evidenceId': evidence_uuid,
            'points': finding['points'],
            'rationale': finding['rationale'],
            'details': finding.get('details', ''),
            's3Key': s3_key,
            'timestamp': generation_date,
            'source': 'pingcastle',
            'domain': domain_normalized,
            'date': date_str
        }
        
        try:
            table.put_item(Item=evidence_item)
            print(f"Written evidence: {composite_pk} / EVID#{evidence_uuid}")
        except Exception as e:
            print(f"Error writing evidence for {risk_id}: {str(e)}")


def write_to_curated(findings, s3_key, generation_date, domain_fqdn):
    """
    Write normalized JSON snapshot to S3 curated bucket.
    Path: curated/findings/source=pingcastle/date=YYYY-MM-DD/{uuid}.json
    Uses generation_date from XML for timestamps.
    """
    # Parse generation_date to extract date component for S3 path
    try:
        # Handle ISO 8601 format: 2025-12-18T14:32:25.6874739-05:00
        # Extract just the date part (first 10 chars: YYYY-MM-DD)
        date_str = generation_date[:10]
    except Exception:
        # Fallback to current date if parsing fails
        date_str = datetime.utcnow().strftime('%Y-%m-%d')
    
    # Normalize domain
    domain_normalized = domain_fqdn.lower().rstrip('.') if domain_fqdn else 'unknown'
    
    snapshot_uuid = str(uuid4())
    
    # Build curated S3 key
    curated_key = f"curated/findings/source=pingcastle/date={date_str}/domain={domain_normalized}/{snapshot_uuid}.json"
    
    # Build snapshot payload
    snapshot = {
        'source': 'pingcastle',
        'timestamp': generation_date,
        'originalS3Key': s3_key,
        'domain': domain_normalized,
        'findingsCount': len(findings),
        'findings': findings,
        'metadata': {
            'processingTime': datetime.utcnow().isoformat(),
            'generationDate': generation_date,
            'version': '1.0'
        }
    }
    
    try:
        s3_client.put_object(
            Bucket=CURATED_BUCKET,
            Key=curated_key,
            Body=json.dumps(snapshot, indent=2),
            ContentType='application/json'
        )
        print(f"Written curated snapshot: s3://{CURATED_BUCKET}/{curated_key}")
    except Exception as e:
        print(f"Error writing curated snapshot: {str(e)}")
        raise
