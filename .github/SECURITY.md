# Security Policy

## Reporting a Vulnerability

We take the security of AD CyberWatch.AI seriously. If you have discovered a security
vulnerability, please report it to us privately so we can address it before public
disclosure.

### How to Report

**Please DO NOT report security vulnerabilities through public GitHub issues.**

Instead, use one of these methods:

#### Method 1: GitHub Security Advisories (Recommended)

1. Navigate to the [Security Advisories](https://github.com/OurITRes/ad-cyberwatch.ai/security/advisories) page
2. Click "Report a vulnerability"
3. Fill out the advisory form with details about the vulnerability
4. Submit the report

This method allows for secure, private discussion and coordinates disclosure.

#### Method 2: Email

If you prefer, you can email security reports to:

**<security@ouritres.com>**

Please include:

- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact assessment
- Any suggested fixes (if available)
- Your contact information for follow-up

### What to Include in Your Report

A good security report should include:

1. **Type of vulnerability** (e.g., SQL injection, XSS, authentication bypass)
2. **Location** - Specific file, function, or endpoint affected
3. **Proof of concept** - Steps to reproduce or demonstration
4. **Impact** - What an attacker could achieve
5. **Affected versions** - Which versions are vulnerable
6. **Suggested remediation** (optional but appreciated)

### Response Timeline

- **Initial Response:** Within 48 hours of receiving your report
- **Status Update:** Within 7 days with our assessment and planned actions
- **Fix Timeline:** Critical vulnerabilities will be addressed within 30 days, others based on severity

### What to Expect

After you submit a vulnerability report:

1. **Acknowledgment** - We'll confirm receipt of your report
2. **Investigation** - We'll validate and assess the vulnerability
3. **Communication** - We'll keep you informed of our progress
4. **Resolution** - We'll develop and test a fix
5. **Disclosure** - We'll coordinate public disclosure with you
6. **Credit** - With your permission, we'll acknowledge your contribution in the security advisory

### Security Updates

Security patches will be released as:

- Patch releases for supported versions
- Security advisories on GitHub
- Notifications through GitHub's security alert system

### Scope

This security policy applies to:

- The AD CyberWatch.AI application code
- Infrastructure configuration (SAM templates, CI/CD)
- Dependencies and third-party integrations
- Deployment and configuration documentation

Out of scope:

- Vulnerabilities in third-party dependencies (report to the upstream project)
- Issues requiring physical access to infrastructure
- Social engineering attacks

### Safe Harbor

We support safe harbor for security researchers:

- Good faith security research and vulnerability disclosure will not result in legal action
- We will not pursue legal action against researchers who:
  - Make a good faith effort to avoid privacy violations, data destruction, and service interruption
  - Report vulnerabilities privately and allow reasonable time for fixes
  - Do not exploit vulnerabilities beyond what's necessary to demonstrate the issue

## Security Best Practices for Contributors

When contributing to this project:

1. **Never commit secrets** (API keys, passwords, tokens, certificates)
2. **Review dependencies** for known vulnerabilities before adding them
3. **Follow secure coding practices** (input validation, output encoding, least privilege)
4. **Use parameterized queries** to prevent SQL injection
5. **Implement proper authentication and authorization** checks
6. **Keep dependencies updated** to get security patches
7. **Run security scans** (CodeQL) before submitting PRs

## Security Features

AD CyberWatch.AI implements these security measures:

- **Authentication** - Secure user authentication with AWS Cognito
- **Authorization** - Role-based access control
- **Data Protection** - Encryption at rest and in transit
- **Dependency Scanning** - Automated via Dependabot
- **Code Scanning** - CodeQL security analysis
- **Security Headers** - CORS, CSP, and other protective headers
- **Input Validation** - Server-side validation of all inputs
- **Audit Logging** - Security-relevant events are logged

## Questions?

For general security questions that are not vulnerability reports, please open a public issue or discussion.

For vulnerability reports, always use the private reporting methods described above.

Thank you for helping keep AD CyberWatch.AI and its users safe!
