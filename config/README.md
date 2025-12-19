# AD Cyberwatch AI - Configuration

This directory contains all configuration files for different environments and security settings.

## Structure

```text
config/
├── environments/        # Environment-specific configurations
│   ├── dev.json        # Development (local/AWS dev stack)
│   ├── staging.json    # Pre-production testing
│   └── prod.json       # Production
├── security/           # Security policies and auth settings
│   ├── iam-policies.json
│   ├── auth-config.json
│   └── README.md
└── .env.example        # Template for local environment variables
```

## Usage

### Local Development

1. Copy `.env.example` to `../.env` at the project root
2. Fill in your local development values
3. Run `npm run dev:both` to start UI + server

### AWS Deployment

1. Choose environment: `dev.json`, `staging.json`, or `prod.json`
2. Deploy with SAM: `sam deploy --config-env [dev|staging|prod]`
3. Update security settings in `security/` as needed

## Environment Variables

- **Development**: Use `.env` file (git ignored)
- **Staging/Production**: Use AWS Systems Manager Parameter Store or Secrets Manager

## Security Notes

- Never commit sensitive credentials
- Use AWS Secrets Manager for production secrets
- Keep `server/data/users.json` private (only for local dev)
- Review `security/README.md` for best practices
