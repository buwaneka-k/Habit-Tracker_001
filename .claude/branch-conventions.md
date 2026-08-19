# Branch Naming Conventions

## Master Branch
Production-ready branch: main

## Feature Branch
Format:  feature/{issue}-{short-description}
Example: feature/12-user-login-page

## Bug Fix Branch
Format:  bug/{issue}-{short-description}
Example: bug/45-null-pointer-on-login

## Hotfix Branch
Format:  hotfix/{issue}-{short-description}
Example: hotfix/50-payment-timeout

## Release Branch
Format:  release/v{version}
Example: release/v1.2.0

---

## Short Description Rules
- Use kebab-case (lowercase, hyphen-separated)
- 3–5 words maximum
- Describe the feature/fix, not the ticket
- No special characters, no spaces

## Issue Number
`{issue}` refers to the GitHub Issue number this branch addresses (this project tracks work via GitHub Issues, not Jira).
