# Contributing to AD CyberWatch.AI

Thank you for your interest in contributing to this project!

## License

This project is licensed under **AGPL-3.0-only**. By contributing, you agree that
your contributions will be licensed under the same terms.

**Important:** The AGPL license requires that any network service using this
software must make the complete source code (including modifications) available to
users. If you deploy a modified version as a service, you must provide access to
the modified source.

## Contribution Workflow

### 1. Fork and Branch

1. **Fork the repository** to your own GitHub account
2. **Clone your fork** locally:

   ```bash
   git clone https://github.com/YOUR_USERNAME/ad-cyberwatch.ai.git
   cd ad-cyberwatch.ai
   ```

3. **Create a feature branch** from `main`:

   ```bash
   git checkout -b feature/your-feature-name
   ```

### 2. Make Your Changes

#### Development Environment

Set up your local development environment:

```bash
# Install all dependencies
npm run install:all

# Run in development mode (frontend + backend)
npm run dev:both

# Or run separately
npm run dev                      # Frontend only
node server/config-server.js    # Backend only
```

#### Code Quality

Before committing, ensure your code meets quality standards:

1. **Run linting:**

   ```bash
   npm run lint        # JavaScript/React linting
   npm run lint:md     # Markdown linting
   ```

2. **Build the project:**

   ```bash
   npm run build
   ```

3. **Test your changes:**
   - Test manually using `npm run dev:both`
   - Verify all affected features work as expected
   - Run existing tests if available

### 3. Commit and Push

1. **Add SPDX headers** to new source files:

   ```javascript
   // SPDX-License-Identifier: AGPL-3.0-only
   // Copyright (C) [Year] [Your Name or Organization]
   ```

2. **Commit with clear messages:**

   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

3. **Push to your fork:**

   ```bash
   git push origin feature/your-feature-name
   ```

### 4. Open a Pull Request

1. **Navigate to the original repository** on GitHub
2. **Click "New Pull Request"** and select your branch
3. **Fill out the PR template completely**, including:
   - Summary of changes
   - Linked issue(s)
   - Affected components
   - **Impact and risk assessment** (required)
   - **Security implications** (required)
   - Testing performed
   - Rollback plan
   - Complete the checklist

4. **Wait for review** - All PRs require approval from project maintainers

## Important Guidelines

### Security and Privacy

- **Never commit secrets** such as API keys, passwords, certificates, or private keys
- **Never commit customer data** or any sensitive information
- Review your changes before committing to ensure no confidential data is included
- Use environment variables or configuration files (excluded via `.gitignore`) for sensitive settings

### Infrastructure Changes

For changes affecting infrastructure, deployment, or sensitive configurations:

- **Document migration steps** if database or infrastructure changes are required
- **Provide a rollback plan** with clear steps to revert changes
- **Consider backward compatibility** to avoid breaking existing deployments

### Code Standards

- Follow existing code style and conventions in the project
- Add comments only where necessary to explain complex logic
- Keep changes focused and minimal - avoid refactoring unrelated code
- Ensure all lint checks pass before submitting

## Merge Process

- **Only maintainers can merge** PRs to protected branches
- All PRs must pass:
  - Required CI checks (linting, build, tests)
  - CodeQL security scanning
  - Code owner reviews (see CODEOWNERS file)
  - Final approval from @IamPhilG
- PRs with incomplete templates or failing checks will not be merged

## Need Help?

- **Questions about contributing?** Open an issue for discussion
- **Found a bug?** Open an issue with reproduction steps
- **Security vulnerability?** See [SECURITY.md](SECURITY.md) for reporting instructions

## Recognition

We appreciate all contributions, whether it's code, documentation, bug reports, or
suggestions. Contributors will be recognized in release notes and project documentation.

Thank you for helping make AD CyberWatch.AI better!
