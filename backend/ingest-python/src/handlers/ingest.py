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
        findings, generation_date = parse_pingcastle_xml(xml_content)
        
        if not findings:
            print("No findings found in XML")
            return {
                'statusCode': 204,
                'body': json.dumps({'message': 'No findings'})
            }
        
        # Write to DynamoDB
        write_to_dynamodb(findings, key, generation_date)
        
        # Write snapshot to S3 curated
        write_to_curated(findings, key, generation_date)
        
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
    Returns tuple: (list of finding dictionaries, generation_date string).
    """
    findings = []
    generation_date = None
    
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
        
        # Find RiskRules section
        risk_rules = root.find('.//RiskRules')
        if risk_rules is None:
            print("No RiskRules section found in XML")
            return findings
        
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
    
    return findings, generation_date


def get_element_text(parent, tag_name):
    """
    Safely extract text from XML element.
    """
    element = parent.find(tag_name)
    return element.text if element is not None and element.text else ''


def write_to_dynamodb(findings, s3_key, generation_date):
    """
    Write findings to DynamoDB.
    Structure:
    - Weakness: pk=WEAK#{riskId}, sk=META
    - Evidence: pk=WEAK#{riskId}, sk=EVID#{uuid}
    Uses generation_date from XML for all timestamps.
    """
    
    for finding in findings:
        risk_id = finding['riskId']
        
        # 1. Write/Update Weakness metadata (WEAK#id / META)
        weakness_item = {
            'pk': f"WEAK#{risk_id}",
            'sk': 'META',
            'riskId': risk_id,
            'category': finding['category'],
            'model': finding['model'],
            'source': 'pingcastle',
            'lastUpdated': generation_date
        }
        
        try:
            table.put_item(Item=weakness_item)
            print(f"Written weakness: WEAK#{risk_id}")
        except Exception as e:
            print(f"Error writing weakness {risk_id}: {str(e)}")
        
        # 2. Write Evidence (WEAK#id / EVID#{uuid})
        evidence_uuid = str(uuid4())
        evidence_item = {
            'pk': f"WEAK#{risk_id}",
            'sk': f"EVID#{evidence_uuid}",
            'evidenceId': evidence_uuid,
            'points': finding['points'],
            'rationale': finding['rationale'],
            'details': finding.get('details', ''),
            's3Key': s3_key,
            'timestamp': generation_date,
            'source': 'pingcastle'
        }
        
        try:
            table.put_item(Item=evidence_item)
            print(f"Written evidence: WEAK#{risk_id} / EVID#{evidence_uuid}")
        except Exception as e:
            print(f"Error writing evidence for {risk_id}: {str(e)}")


def write_to_curated(findings, s3_key, generation_date):
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
    
    snapshot_uuid = str(uuid4())
    
    # Build curated S3 key
    curated_key = f"curated/findings/source=pingcastle/date={date_str}/{snapshot_uuid}.json"
    
    # Build snapshot payload
    snapshot = {
        'source': 'pingcastle',
        'timestamp': generation_date,
        'originalS3Key': s3_key,
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
