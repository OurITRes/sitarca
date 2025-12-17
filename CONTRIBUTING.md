# Contributing to AD CyberWatch.AI

Thank you for your interest in contributing to this project!

## License

This project is licensed under **AGPL-3.0-only**. By contributing, you agree that
your contributions will be licensed under the same terms.

**Important:** The AGPL license requires that any network service using this
software must make the complete source code (including modifications) available to
users. If you deploy a modified version as a service, you must provide access to
the modified source.

## Security & Privacy

- **Never commit secrets** such as API keys, passwords, certificates, or private
   keys
- **Never commit customer data** or any sensitive information
- Review your changes before committing to ensure no confidential data is
   included
- Use environment variables or configuration files (excluded via `.gitignore`) for
   sensitive settings

## Code Standards

### SPDX Headers

Please add SPDX license headers to new source files:

```javascript
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) [Year] [Your Name or Organization]
```

### Code Quality

Before submitting your changes:

1. **Run the linter:**

   ```bash
   npm run lint
   ```

2. **Test your changes locally:**

   ```bash
   npm run dev        # Run frontend only
   npm run dev:both   # Run both frontend and backend
   ```

3. **Build the project to verify:**

   ```bash
   npm run build
   ```

## Submitting Changes

1. **Fork the repository** and create a new branch from `main`
2. **Make your changes** following the code standards above
3. **Test thoroughly** using the commands listed above
4. **Commit with clear messages** describing what and why
5. **Open a Pull Request** against the `main` branch with:
   - A clear description of the changes
   - Reference to any related issues
   - Confirmation that you've tested the changes

## Questions?

If you have questions about contributing, please open an issue for discussion
before starting work on significant changes.
