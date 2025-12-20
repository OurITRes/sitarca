# Repository Governance Setup Guide

This document explains the governance and security configuration added to this repository and
the manual steps required to complete the setup.

## Files Added

### 1. Pull Request Template (`.github/PULL_REQUEST_TEMPLATE.md`)

**Purpose:** Enforces comprehensive documentation for all pull requests.

**Key Requirements:**

- Summary and linked issue
- Affected components checklist
- **Impact and Risk Assessment** (required) - Forces contributors to analyze the impact level
  (Low/Medium/High) and document potential risks with mitigation strategies
- **Security Implications** (required) - Requires explicit security analysis for every change
- Testing and validation evidence
- Rollback plan with clear steps
- Comprehensive checklist including CI, CodeQL, reviews, documentation, and changelog updates

### 2. Code Owners (`.github/CODEOWNERS`)

**Purpose:** Defines required reviewers for different parts of the codebase.

**Configuration:**

- Default: All changes require approval from `@IamPhilG`
- Documentation (`/docs/`, `*.md`): Requires `@OurITRes/docs-team` + `@IamPhilG`
- Infrastructure (`/infra/`, `/config/`, `.github/workflows/`): Requires `@OurITRes/ops-team` +
  `@IamPhilG`

**Note:** Teams `@OurITRes/docs-team` and `@OurITRes/ops-team` are examples. You can create these
teams in your organization or modify the file to use actual team names.

### 3. Contributing Guidelines (`.github/CONTRIBUTING.md`)

**Purpose:** Documents the contribution workflow and requirements.

**Key Points:**

- Fork → Branch → PR workflow
- Local testing requirements (lint, build, manual testing)
- SPDX license headers for new files
- Security guidelines (never commit secrets)
- Infrastructure changes require migration/rollback plans
- Merges restricted to maintainers (enforced via branch protection)

### 4. Security Policy (`.github/SECURITY.md`)

**Purpose:** Defines how to report vulnerabilities privately.

**Reporting Methods:**

1. GitHub Security Advisories (recommended)
2. Email: <security@ouritres.com>

**Response Timeline:**

- Initial response: 48 hours
- Status update: 7 days
- Critical fixes: 30 days

### 5. Dependabot Configuration (`.github/dependabot.yml`)

**Purpose:** Automated dependency updates to keep the project secure and up-to-date.

**Configured For:**

- npm (root, `/ui`, `/backend/api-node`)
- pip (`/backend/ingest-python`)
- GitHub Actions

**Schedule:** Weekly on Mondays at 9:00 AM, max 5 open PRs per ecosystem

### 6. CI Workflow (`.github/workflows/pr-checks.yml`)

**Purpose:** Automated checks on pull requests.

**Job Name:** `build-and-test` (used as required status check)

**Steps:**

- Checkout code
- Setup Node.js (matrix: 18.x, 20.x)
- Install dependencies (root, UI, backend API)
- Run linters (JavaScript, Markdown)
- Build UI
- Run tests (if available)

### 7. CodeQL Security Scanning (`.github/workflows/codeql-analysis.yml`)

**Purpose:** Automated security vulnerability scanning.

**Job Name:** `CodeQL` (used as required status check)

**Configuration:**

- Languages: JavaScript, Python
- Triggers: PRs, pushes to main/develop, weekly schedule (Mondays 2 AM UTC)
- Permissions: Read actions/contents, write security-events

## Manual Setup Required

The following steps must be completed manually via GitHub UI or API:

### Step 1: Configure Branch Protection Rules

Branch protection rules cannot be set via repository files. You must configure them through:

#### Option A: GitHub Web UI

1. Go to repository **Settings** → **Branches**
2. Click **Add branch protection rule** or edit existing rule for `main`
3. Configure the following:

   **Branch name pattern:** `main`

   **Protect matching branches:**

   - ✅ Require a pull request before merging
     - ✅ Require approvals: 1
     - ✅ Dismiss stale pull request approvals when new commits are pushed
     - ✅ Require review from Code Owners
   - ✅ Require status checks to pass before merging
     - ✅ Require branches to be up to date before merging
     - Required status checks:
       - `build-and-test`
       - `CodeQL`
   - ✅ Require conversation resolution before merging
   - ✅ Require linear history (optional but recommended)
   - ✅ Do not allow bypassing the above settings
   - ❌ Allow force pushes (keep disabled)
   - ❌ Allow deletions (keep disabled)

   **Restrict who can push to matching branches:**

   - Add user: `IamPhilG`
   - (Optionally add a `maintainers` team)

4. Click **Create** or **Save changes**

#### Option B: Using the Provided Script

We've included a script to automate branch protection configuration:

```bash
# Authenticate with GitHub CLI
gh auth login

# Run the configuration script
./scripts/configure-branch-protection.sh
```

Or using a Personal Access Token:

```bash
# Create token at https://github.com/settings/tokens with repo scope
export GITHUB_TOKEN=ghp_your_token_here
./scripts/configure-branch-protection.sh
```

### Step 2: Enable Repository Security Features

1. Go to **Settings** → **Security & analysis**
2. Enable the following:
   - ✅ **Dependabot alerts** - Get notified of vulnerable dependencies
   - ✅ **Dependabot security updates** - Auto-create PRs for security patches
   - ✅ **Secret scanning** - Detect committed secrets
   - ✅ **Push protection** - Block pushes containing secrets

### Step 3: Create GitHub Teams (Optional)

If you want to use the team-based code ownership defined in CODEOWNERS:

1. Go to your organization **Teams** page
2. Create teams:
   - `docs-team` - For documentation reviewers
   - `ops-team` - For infrastructure/operations reviewers
3. Add appropriate members to each team
4. Teams will automatically be requested as reviewers based on CODEOWNERS file

If you don't want to use teams, edit `.github/CODEOWNERS` to remove team references.

### Step 4: Verify Workflow Runs

After the first PR:

1. Go to **Actions** tab
2. Verify both workflows run successfully:
   - **PR Checks** (build-and-test job)
   - **CodeQL Security Scan** (CodeQL job)
3. If workflows fail, check the logs and fix any issues

### Step 5: Organization-Level Security (Optional)

For additional security:

1. **Two-Factor Authentication (2FA):**
   - Organization Settings → Authentication security
   - Require 2FA for all organization members

2. **SAML SSO (Enterprise only):**
   - Configure single sign-on if your organization uses it

3. **Base Permissions:**
   - Organization Settings → Member privileges
   - Set base repository permission to "Read" for organization members
   - Grant write access only to specific teams/collaborators

## How This Helps

### Prevents Unauthorized Changes

- **Branch Protection:** Only authorized users can merge to protected branches
- **Required Reviews:** All changes must be reviewed and approved
- **Code Owners:** Domain experts automatically assigned as reviewers
- **Status Checks:** Changes must pass CI and security scans before merge

### Enforces Impact Analysis

- **PR Template:** Forces contributors to document:
  - What components are affected
  - Impact level (Low/Medium/High)
  - Potential risks and mitigations
  - Security implications
  - Rollback plan
- **Deep Understanding:** Reviewers can quickly assess the scope and risk of changes

### Maintains Code Quality

- **Automated Linting:** Catches style issues before review
- **Build Validation:** Ensures changes don't break the build
- **Security Scanning:** Detects vulnerabilities in code and dependencies
- **Dependabot:** Keeps dependencies up-to-date automatically

### Allows Open Contribution

- **Forks Welcome:** Anyone can fork the repository
- **Open PRs:** Contributors can submit pull requests
- **Governance Enforced:** Protection is on the merge, not the contribution
- **Clear Process:** CONTRIBUTING.md guides contributors through the workflow

## Testing the Configuration

After setup, test the configuration:

1. **Create a test PR** from a branch
2. **Verify CODEOWNERS** are automatically requested as reviewers
3. **Check status checks** appear and run (`build-and-test`, `CodeQL`)
4. **Try to merge without approval** - should be blocked
5. **Try to push directly to main** - should be blocked (if you're not in the allowed list)

## Troubleshooting

### "Required status checks are not passing"

- Check the Actions tab for workflow failures
- Ensure both `build-and-test` and `CodeQL` jobs pass
- Fix any linting, build, or security issues

### "Review required from code owner"

- Ensure `@IamPhilG` or appropriate code owners approve the PR
- If teams don't exist, create them or modify CODEOWNERS

### "Push to branch is restricted"

- This is expected for protected branches
- All changes must go through pull requests
- Only authorized users can merge PRs

### Workflows not running

- Check that workflows are in `.github/workflows/` directory
- Ensure YAML syntax is valid
- Check Actions permissions in Settings → Actions → General

## Support

For questions about this governance setup:

- Open an issue in this repository
- Contact the repository maintainers
- See SECURITY.md for security-related questions

## Summary

This governance configuration provides:

✅ **Open contribution** through forks and pull requests
✅ **Required impact analysis** on every PR via the template
✅ **Automated quality checks** (linting, building, testing)
✅ **Security scanning** (CodeQL, Dependabot, secret scanning)
✅ **Code owner reviews** ensuring domain experts approve changes
✅ **Branch protection** preventing unauthorized merges
✅ **Clear processes** documented in CONTRIBUTING.md and SECURITY.md

The main branch protection must be configured manually (see Step 1 above) but can be done easily
via the web UI or the provided script.
