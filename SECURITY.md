# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| latest  | :white_check_mark: |

## Reporting a Vulnerability

We take the security of VoiceAlarm seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report

1. **DO NOT** create a public GitHub issue for security vulnerabilities.
2. Use [GitHub Private Vulnerability Reporting](https://github.com/perso-devrel/voice_alarm/security/advisories/new) to submit your report.
3. Alternatively, email us at **devrel.365@gmail.com** with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- **Acknowledgment**: Within 48 hours of your report.
- **Status Update**: Within 7 days with an initial assessment.
- **Resolution**: We aim to patch critical vulnerabilities within 14 days.

### Scope

The following are in scope:
- Authentication/authorization bypasses
- SQL injection, XSS, CSRF
- API key or secret exposure
- Voice data privacy leaks
- Privilege escalation
- Remote code execution

### Out of Scope

- Denial of service (DoS) attacks
- Social engineering
- Issues in third-party dependencies (report to the upstream project)
- Issues requiring physical access to a user's device

### Recognition

We appreciate responsible disclosure and will:
- Credit reporters in our release notes (unless anonymity is requested)
- Work with you to understand and resolve the issue

## Security Best Practices for Contributors

- Never commit API keys, tokens, or secrets
- Use environment variables for all sensitive configuration
- Voice data must be encrypted at rest and in transit
- Follow OWASP Top 10 guidelines
- All PRs require review before merging to main
