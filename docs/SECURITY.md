# Security & Data Handling Guidelines

## Never Commit Sensitive Data

This repository is designed to work **without ever storing production data
in git**. Follow these rules strictly:

### Prohibited Data

**NEVER commit:**

- Customer PingCastle XML exports (`.xml` files containing real scan results)
- BloodHound JSON exports or ZIP archives containing production AD data
- User lists, email addresses, or any personally identifiable information (PII)
- API keys, tokens, credentials, passwords, or secrets
- Private SSL certificates or authentication materials
- Production configuration files with real values (use `.env.example` instead)
- Database backups or dumps containing production data

These files will be blocked by `.gitignore` patterns, but exercise extra caution.

## Environment Variables

### Frontend (.env.local)

Copy `.env.example` to `.env.local` in the project root:

```bash
cp .env.example .env.local
```

Customize `VITE_API_BASE_URL` and any authentication settings. **Never commit `.env.local`.**

### Backend (.env)

Copy `server/.env.example` to `server/.env`:

```bash
cp server/.env.example server/.env
```

Set `PORT`, database credentials, SSO settings, and feature flags.
**Never commit `server/.env`.**

## Working with Demo & Synthetic Data

### Sample Datasets

The repository includes synthetic demo data for testing:

- `server/data/config.json` — Sample configuration (safe to commit)
- `server/data/users.json` — Test user accounts (safe to commit if anonymized)
- `server/data/PingCastleRules.xml` — Empty rules template (safe to commit)

These are **demo/test data only**. Ensure they contain:

- No real customer information
- Anonymized or placeholder values
- Clear comments marking them as synthetic

### Creating New Demo Data

If you create demo datasets for documentation or testing:

1. Use **realistic but fictional** data (e.g., `demo.example.com` domain)
2. Remove any real customer names, IDs, or sensitive details
3. Place in a clearly marked folder like `server/data/samples/`
4. Document the data in `README.md` or code comments

## Data Upload & Processing

### Temporary Data Handling

For production deployments that need to import customer data:

1. **No git storage** — Use file upload endpoints instead:
   - Frontend uploads PingCastle XML, BloodHound exports via UI
   - Server processes files from `/server/uploads/` or `/server/data_imports/`
   - These directories are in `.gitignore` and only exist at runtime

2. **Clear documentation** — Tell users:
   - "Upload your AD security scan files here"
   - "Files are processed and not stored permanently"
   - "Results are generated without archiving raw exports"

3. **Data lifecycle** — Implement cleanup:

   ```javascript
   // Example: Auto-delete imports after processing
   fs.unlink(uploadPath, (err) => {
     if (err) console.error('Failed to delete:', uploadPath);
   });
   ```

## Checking Before Commit

Before committing, verify with:

```bash
# List files staged for commit
git diff --cached --name-only

# Check for accidentally staged secrets
git diff --cached | grep -E "password|secret|token|key|AWS_|PRIVATE_"

# Never force-push .env or secret files if accidentally committed
# Instead, use git-filter-repo or contact maintainers
```

## Reporting Accidentally Committed Secrets

If you discover sensitive data was committed:

1. **Immediately notify** the repository maintainers
2. **Rotate credentials** (keys, passwords, tokens are now public)
3. **Do not attempt to "fix"** via new commits (git history is
   immutable without rewriting)
4. Maintainers can use `git-filter-repo` to cleanse history if needed

## Enterprise Deployment Checklist

- [ ] `.env.local` and `server/.env` created from `.example` files with
      real values
- [ ] No `.env*` files committed to git
- [ ] API keys and tokens stored in secure vault (e.g., HashiCorp Vault,
      Azure Key Vault)
- [ ] All user uploads go to `/data_imports/` or similar `.gitignore`'d
      folder
- [ ] Processed results are not persisted to git
- [ ] `.gitignore` blocks `*.xml`, `*.json` exports, and data directories
- [ ] Documentation clearly states: "This repo contains demo data only;
      customer data is never committed"

## References

- [OWASP: Secrets Management](https://owasp.org/www-community/Secrets_Management)
- [GitHub: Security best practices](https://docs.github.com/en/code-security)
- [git-filter-repo documentation](https://github.com/newren/git-filter-repo)
