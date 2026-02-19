# WEZET Professional Workflow (Fast + Safe)

This setup is designed for urgent production fixes while keeping high engineering standards.

## 1) GitHub setup (one-time)

### Required repository secrets
Set these secrets in `FXGO-web/wezet-booking-app`:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Example:

```bash
gh secret set VERCEL_TOKEN --repo FXGO-web/wezet-booking-app
gh secret set VERCEL_ORG_ID --repo FXGO-web/wezet-booking-app
gh secret set VERCEL_PROJECT_ID --repo FXGO-web/wezet-booking-app
```

### Branch protection for `main` (recommended)
Enable in GitHub settings:

- Require pull request before merging
- Require at least 1 approval
- Require status checks to pass
  - `Frontend Build`
- Restrict force pushes and deletions

## 2) Daily flow

1. Create branch from `main`:

```bash
git checkout main
git pull
git checkout -b codex/hotfix-short-description
```

2. Make and test changes.
3. Fast commit/push:

```bash
scripts/actions/commit-push.sh "fix(auth): short message"
```

4. Create PR:

```bash
scripts/actions/create-pr.sh "hotfix: short title"
```

5. Merge after checks pass.
6. Production deploy runs automatically from `main` (`Deploy Production` workflow).

## 3) Emergency flow

Use only for critical incidents:

1. Hotfix branch + minimal fix.
2. Commit/push.
3. PR + 1 approval.
4. Run manual deploy workflow if needed:

```bash
scripts/actions/run-hotfix-deploy.sh "critical login outage" production
```

For stricter incident PRs, use the hotfix template:

`https://github.com/FXGO-web/wezet-booking-app/compare/main...<your-branch>?expand=1&template=hotfix.md`

## 4) Automatic versioning and changelog

The `Release` workflow now runs on every push to `main` and:

- Detects semantic bump from commit messages:
  - `BREAKING CHANGE` or `!:` -> major
  - `feat:` -> minor
  - anything else -> patch
- Creates a new tag (`vX.Y.Z`)
- Creates a GitHub Release with auto-generated notes/changelog

Manual release trigger (optional):

```bash
scripts/actions/run-release.sh auto
scripts/actions/run-release.sh patch
scripts/actions/run-release.sh minor
scripts/actions/run-release.sh major
```

## 5) Run Action commands (Codex / Antigravity)

Use these command actions:

- `scripts/actions/commit-push.sh "<message>"`
- `scripts/actions/create-pr.sh "<title>"`
- `scripts/actions/run-hotfix-deploy.sh "<reason>" production`
- `scripts/actions/run-release.sh "auto|patch|minor|major"`

This gives you one-click speed without exposing tokens.

## 6) Token safety

- Never paste tokens in chat.
- Keep auth in keychain (`gh auth login --with-token`).
- Use GitHub Secrets for CI/CD; never commit `.env` secrets.
