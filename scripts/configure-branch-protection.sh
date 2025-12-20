#!/usr/bin/env bash
# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2024 OurITRes
#
# Script to configure branch protection rules for the main branch
# This script uses the GitHub API to set up branch protection with required checks
#
# Prerequisites:
# - GitHub CLI (gh) installed and authenticated, OR
# - GITHUB_TOKEN environment variable set with repo admin permissions
#
# Usage:
#   ./scripts/configure-branch-protection.sh
#   # Or with explicit token:
#   GITHUB_TOKEN=ghp_xxx ./scripts/configure-branch-protection.sh

set -e

REPO_OWNER="OurITRes"
REPO_NAME="ad-cyberwatch.ai"
BRANCH="main"

echo "🔒 Configuring branch protection for ${REPO_OWNER}/${REPO_NAME}:${BRANCH}"

# Check if gh CLI is available and authenticated
if command -v gh &> /dev/null && gh auth status &> /dev/null; then
    echo "✓ Using GitHub CLI (gh)"
    USE_GH_CLI=true
elif [ -n "$GITHUB_TOKEN" ]; then
    echo "✓ Using GITHUB_TOKEN environment variable"
    USE_GH_CLI=false
else
    echo "❌ Error: Neither 'gh' CLI is authenticated nor GITHUB_TOKEN is set"
    echo ""
    echo "Please either:"
    echo "  1. Install and authenticate GitHub CLI: gh auth login"
    echo "  2. Set GITHUB_TOKEN: export GITHUB_TOKEN=ghp_your_token_here"
    echo ""
    echo "Token needs 'repo' scope with admin permissions"
    exit 1
fi

# Branch protection configuration
PROTECTION_CONFIG='{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "build-and-test",
      "CodeQL"
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true,
    "required_approving_review_count": 1,
    "require_last_push_approval": false
  },
  "restrictions": {
    "users": ["IamPhilG"],
    "teams": [],
    "apps": []
  },
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": true,
  "lock_branch": false,
  "allow_fork_syncing": true
}'

echo ""
echo "📋 Configuration to apply:"
echo "  - Branch: ${BRANCH}"
echo "  - Required status checks: build-and-test, CodeQL"
echo "  - Require pull request reviews with Code Owner approval"
echo "  - Dismiss stale approvals on new commits"
echo "  - Enforce for administrators"
echo "  - Push/merge restricted to: IamPhilG"
echo "  - Require conversation resolution"
echo "  - Block force pushes and deletions"
echo ""

# Apply branch protection
if [ "$USE_GH_CLI" = true ]; then
    echo "🔄 Applying branch protection via GitHub CLI..."
    # Using gh api command
    gh api \
        --method PUT \
        -H "Accept: application/vnd.github+json" \
        -H "X-GitHub-Api-Version: 2022-11-28" \
        "/repos/${REPO_OWNER}/${REPO_NAME}/branches/${BRANCH}/protection" \
        --input - <<< "$PROTECTION_CONFIG"
else
    echo "🔄 Applying branch protection via curl..."
    curl -X PUT \
        -H "Authorization: Bearer ${GITHUB_TOKEN}" \
        -H "Accept: application/vnd.github+json" \
        -H "X-GitHub-Api-Version: 2022-11-28" \
        "https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/branches/${BRANCH}/protection" \
        -d "$PROTECTION_CONFIG"
fi

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Branch protection successfully configured!"
    echo ""
    echo "📝 Next steps:"
    echo "  1. Verify settings at: https://github.com/${REPO_OWNER}/${REPO_NAME}/settings/branches"
    echo "  2. Enable security features in Settings > Security & analysis:"
    echo "     - Dependabot alerts"
    echo "     - Dependabot security updates"
    echo "     - Secret scanning"
    echo "     - Push protection for secret scanning"
    echo "  3. Consider enabling 2FA for organization members"
    echo "  4. Review and adjust team access if needed"
else
    echo ""
    echo "❌ Failed to configure branch protection"
    echo "Please check:"
    echo "  - Token has admin:repo_hook and repo permissions"
    echo "  - Repository exists and you have admin access"
    echo "  - Branch '${BRANCH}' exists"
    exit 1
fi
