# Security Configuration

This directory contains security-related configuration files for the AD Cyberwatch application.

## Files

### iam-policies.json

IAM role policies for AWS Lambda functions:

- **LambdaBasicExecution**: CloudWatch Logs permissions
- **DynamoDBReadWrite**: DynamoDB table access
- **S3ReadWrite**: S3 bucket access for raw/curated/frameworks buckets

### auth-config.json

Authentication and authorization settings:

- **Cognito**: User pool settings, password policy, MFA
- **CORS**: Allowed origins, methods, headers
- **RateLimiting**: API throttling settings

## Security Best Practices

1. **Never commit sensitive credentials** to Git
2. **Use AWS Secrets Manager** for production secrets
3. **Enable MFA** for production Cognito user pools
4. **Rotate credentials** regularly
5. **Monitor CloudWatch Logs** for suspicious activity
6. **Use least privilege principle** for IAM policies

## Local Development

For local development, copy `../config/.env.example` to `.env` at the root and fill in your values.
