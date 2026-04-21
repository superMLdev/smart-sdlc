# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| Latest (`main`) | ✅ |
| Previous minor | ✅ security fixes only |
| Older releases | ❌ |

We recommend always running the latest published version:

```bash
npx @supermldev/smart-sdlc@latest init
```

---

## Reporting a Vulnerability

**Please do not open a public GitHub Issue for security vulnerabilities.**

Report security issues privately by emailing:

**security@superml.org**

Include in your report:
- A description of the vulnerability and its potential impact
- Steps to reproduce (or a proof of concept)
- Smart SDLC version affected (`npx @supermldev/smart-sdlc --version`)
- Any suggested mitigations if you have them

We will acknowledge your report within **48 hours** and aim to release a fix within **14 days** for confirmed critical issues.

You are welcome to request credit in the release notes. We will not take legal action against good-faith security researchers.

---

## Security Design Notes

### Credential storage

- `_superml/config.yml` is **gitignored by default** — it stores API tokens, base URLs, and auth headers for integrations
- `_superml/persona.yml` is **gitignored by default** — it stores personal preferences, never credentials
- `.vscode/mcp.json` may contain MCP server tokens — Smart SDLC skills instruct users to add it to `.gitignore`; it is **not** written to git-tracked files by any Smart SDLC command

### No runtime execution of AI output

Smart SDLC skills are markdown instruction files read by the AI assistant. The CLI (`bin/superml.js`) does not execute AI-generated code or evaluate untrusted input.

### No network calls from the CLI

The CLI itself makes no outbound network requests. All integration calls (JIRA, Confluence, etc.) are made by the AI assistant via `curl` in a terminal or via MCP tool calls — under the user's own credentials and with explicit user intent.

### Prompt injection awareness

Skills are static markdown files. If you modify a skill file or add content to `_superml/reference/` from an untrusted source, be aware that an attacker-controlled file loaded into AI context could attempt to manipulate the AI's behaviour. Only load reference docs and skills from sources you trust.

### Dependency surface

Smart SDLC has **zero runtime npm dependencies**. The attack surface from the installed package is limited to the CLI source code itself.

---

## Scope

The following are **in scope** for security reports:

- Vulnerabilities in `bin/superml.js`, `lib/`, or `config/` that could lead to credential exposure, arbitrary code execution, or privilege escalation
- Skill instructions that could be exploited to exfiltrate secrets from the AI's context
- `.gitignore` generation bugs that could cause credentials to be committed

The following are **out of scope**:

- Vulnerabilities in the AI assistant itself (GitHub Copilot, Claude, etc.) — report those to the respective vendor
- Vulnerabilities in third-party MCP servers (`@sooperset/mcp-atlassian`, Atlassian Remote MCP, etc.) — report those to their maintainers
- Social engineering attacks that require physical access to the user's machine

---

## Community

Join the Smart SDLC community on Discord: [discord.gg/26XMXkEt](https://discord.gg/26XMXkEt)

For general questions and discussions, please use Discord rather than GitHub Issues. Security reports should still go to **security@superml.org**.
