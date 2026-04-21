# Integrations — Smart SDLC

Smart SDLC connects to external systems via CLI tools your AI assistant runs in the terminal. No API keys are embedded in skills — credentials are stored in `_superml/config.yml` (git-ignored).

---

## Supported Integrations

| System | What It Does | Connection Mode |
|---|---|---|
| **JIRA** | Create epics/stories, sync backlog, detect conflicts | REST API or MCP Server |
| **Confluence** | Push planning docs, sync PRDs and architecture | REST API or MCP Server |
| **GitHub** | Create branches, open PRs, link commits | `gh` CLI |
| **GitLab** | Create branches, open merge requests | `glab` CLI |
| **Azure DevOps** | Create work items, manage sprints | `az devops` (Azure CLI) |
| **Company Knowledge** | Pull internal docs, frameworks, and platform libraries into AI context | URL (REST) or MCP Server |

All integrations are **opt-in**. Set `enabled: true` in the relevant section of `_superml/config.yml`.

---

## MCP Server Setup

JIRA, Confluence, and Company Knowledge integrations can use **Model Context Protocol (MCP) servers** instead of REST API calls. In MCP mode the AI makes tool calls directly from chat — no `curl`, no stored API tokens.

> **When to use MCP mode:**
> - You want to avoid storing Atlassian API tokens locally
> - Your company already operates an MCP server for internal systems
> - You prefer the AI to query live data interactively rather than via shell commands

MCP servers are configured in `.vscode/mcp.json` in your project root. Smart SDLC skills read `server_name` from `_superml/config.yml` and call that server by name in Copilot chat.

> **Security:** Add `.vscode/mcp.json` to `.gitignore` — it may contain tokens or server URLs you don't want committed.

---

### Option 1 — Atlassian Remote MCP (official, Jira/Confluence cloud)

The official Atlassian MCP server. Uses OAuth — no API token required.

**Prerequisites**: Atlassian Cloud account with admin or API access.

**1. Add to `.vscode/mcp.json`:**

```json
{
  "servers": {
    "atlassian": {
      "type": "http",
      "url": "https://mcp.atlassian.com/v1/sse",
      "gallery": true
    }
  }
}
```

**2. Authenticate:**

Open GitHub Copilot Chat, type `@atlassian` — Copilot will prompt you to sign in via OAuth. Approve the required Jira and Confluence scopes.

**3. Verify:**

```
@atlassian list my projects
```

You should see your Atlassian projects listed in chat.

**4. Set in config:**

```yaml
# _superml/config.yml
jira:
  connection_mode: mcp
  mcp_server:
    type: atlassian_remote
    name: atlassian

confluence:
  connection_mode: mcp
  mcp_server:
    type: atlassian_remote
    name: atlassian    # same server — reused automatically
```

---

### Option 2 — @sooperset/mcp-atlassian (self-hosted, Cloud + Server/Data Centre)

An npm-published MCP server that works with both Atlassian Cloud and self-hosted Jira/Confluence Server or Data Centre.

**Prerequisites**: Node.js 18+.

**1. Add to `.vscode/mcp.json`:**

For **Atlassian Cloud** (API token auth):
```json
{
  "servers": {
    "atlassian": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@sooperset/mcp-atlassian"],
      "env": {
        "CONFLUENCE_URL": "https://your-org.atlassian.net/wiki",
        "CONFLUENCE_USERNAME": "you@yourorg.com",
        "CONFLUENCE_API_TOKEN": "your-token",
        "JIRA_URL": "https://your-org.atlassian.net",
        "JIRA_USERNAME": "you@yourorg.com",
        "JIRA_API_TOKEN": "your-token"
      }
    }
  }
}
```

For **Jira/Confluence Server or Data Centre** (Personal Access Token):
```json
{
  "servers": {
    "atlassian": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@sooperset/mcp-atlassian"],
      "env": {
        "CONFLUENCE_URL": "https://confluence.yourcompany.com",
        "CONFLUENCE_PERSONAL_TOKEN": "your-pat",
        "JIRA_URL": "https://jira.yourcompany.com",
        "JIRA_PERSONAL_TOKEN": "your-pat"
      }
    }
  }
}
```

**2. Verify:**

Restart VS Code (or reload the MCP extension), then in Copilot Chat:
```
@atlassian list projects
```

**3. Set in config:**

```yaml
# _superml/config.yml
jira:
  connection_mode: mcp
  mcp_server:
    type: sooperset
    name: atlassian

confluence:
  connection_mode: mcp
  mcp_server:
    type: sooperset
    name: atlassian
```

---

### Option 3 — Custom or Company MCP Server

Use any MCP server your company hosts — for Jira, Confluence, internal developer portals, or any other system.

**1. Add to `.vscode/mcp.json`:**

For a **hosted HTTP/SSE endpoint**:
```json
{
  "servers": {
    "platform-docs": {
      "type": "http",
      "url": "https://mcp.internal.yourcompany.com/sse",
      "headers": {
        "Authorization": "Bearer YOUR_INTERNAL_TOKEN"
      }
    }
  }
}
```

For a **local CLI / npm package**:
```json
{
  "servers": {
    "platform-docs": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@yourorg/platform-mcp-server"],
      "env": {
        "API_TOKEN": "your-token"
      }
    }
  }
}
```

For a **local shell command**:
```json
{
  "servers": {
    "internal-docs": {
      "type": "stdio",
      "command": "/usr/local/bin/internal-mcp",
      "args": ["--config", "~/.mcp-config.json"]
    }
  }
}
```

**2. Verify:**

In Copilot Chat, call the server by its key in `.vscode/mcp.json`:
```
@platform-docs help
```

**3. Reference in config** (for Company Knowledge sources):

```yaml
# _superml/config.yml
company_knowledge:
  enabled: true
  sources:
    - key: platform-docs
      name: "Platform Docs"
      access:
        type: mcp
        server_name: platform-docs   # must match the key in .vscode/mcp.json
```

---

### Enabling MCP in VS Code

MCP server support requires **GitHub Copilot with agent mode enabled** (VS Code 1.99+).

1. Open VS Code Settings → search `chat.mcp.enabled` → set to `true`
2. Create or edit `.vscode/mcp.json` in your project root with the server definition
3. Reload VS Code — new servers appear automatically in Copilot Chat
4. Call the server using `@server-name` in any Copilot Chat message

> MCP servers defined in `.vscode/mcp.json` are workspace-scoped. You can also define global servers in VS Code User Settings under `mcp.servers` if you want them available across all projects.

---

## JIRA

> **Connection modes**: JIRA supports both REST API (email + API token) and MCP Server. Run `/sml-jira-connect` — it asks which mode you want and handles setup for both.

### Setup

**1. Enable JIRA in config:**

```yaml
# _superml/config.yml
jira:
  enabled: true
  base_url: "https://your-org.atlassian.net"
  project_key: "PROJ"
  email: "you@yourorg.com"
  api_token: ""           # see below
```

**2. Generate an API token:**

1. Log in to [id.atlassian.com](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click **Create API token**
3. Copy the token into `api_token` in `config.yml`

> **Using MCP Server instead?** Skip the API token — `/sml-jira-connect` will walk you through configuring one of:
> - **Atlassian Remote MCP** — official OAuth-based cloud server (no credentials stored locally)
> - **`@sooperset/mcp-atlassian`** — self-hosted npm package, supports both Cloud and Server/Data Centre
> - **Custom URL** — your company’s own hosted MCP endpoint
>
> In MCP mode, the AI uses Copilot tool calls to `@atlassian` instead of `curl`. No credentials are written to `_superml/config.yml`.

**3. Connect and verify:**

```
/sml-jira-connect
```

The AI will test the connection using your credentials and report success or a diagnostic message.

### Skills

#### `/sml-jira-sync` — Full backlog sync

Reads `_superml-output/planning/epics-stories.md` and creates all epics and stories in JIRA. Skips any that already exist (matched by title).

```yaml
# Required config fields
jira:
  enabled: true
  epic_issue_type: "Epic"      # matches your Jira project's issue type name
  story_issue_type: "Story"
  task_issue_type: "Task"
```

#### `/sml-jira-create-epic` — Single epic

Creates one epic from the current planning artifact. Useful when you want to push one epic at a time rather than syncing all at once.

#### `/sml-jira-create-story` — Single story

Creates one story ticket from the current story file. The AI fills in title, description, acceptance criteria, and story points from the Smart SDLC story format.

#### `/sml-jira-conflict-detect` — Pre-branch check

Before creating a feature branch, the Developer agent checks the JIRA ticket status. If the story is already `In Progress`, `In Review`, or `Done`, it warns the user to avoid duplicate parallel work.

```yaml
# config.yml
conflict_detection:
  enabled: true
  check_jira_before_branch: true
  blocked_statuses: ["In Progress", "In Review", "Done"]
```

### Sprint Integration

When `board_id` is set in config and `sprint-planning` is run with JIRA enabled, the sprint skill:
1. Creates a new sprint on the board (if one doesn't exist)
2. Moves selected stories into the sprint
3. Sets story assignees from `default_assignee` or user input

---

## Confluence

> **Connection modes**: same as JIRA. If JIRA is already connected via MCP, `/sml-confluence-connect` detects this and offers to reuse the same Atlassian MCP server — no extra setup needed.

### Setup

**1. Enable Confluence in config:**

```yaml
# _superml/config.yml
confluence:
  enabled: true
  base_url: "https://your-org.atlassian.net/wiki"
  space_key: "PROJ"
  email: "you@yourorg.com"
  api_token: ""        # same Atlassian API token as JIRA
  root_page_title: "Project Docs"
  prd_page_parent: "Requirements"
  architecture_page_parent: "Architecture"
  stories_page_parent: "Stories"
```

**2. Connect and verify:**

```
/sml-confluence-connect
```

### Skills

#### `/sml-confluence-push-doc` — Push a single document

Pushes a planning artifact to Confluence as a formatted page. The AI converts markdown to Confluence wiki format and:
- Creates the page under the configured parent if it doesn't exist
- Updates the page if it does exist (adds a version note)
- Applies the `root_page_title` hierarchy from config

Supported documents:
- PRDs → under `prd_page_parent`
- Architecture → under `architecture_page_parent`
- Epics & Stories → under `stories_page_parent`

#### Version Traceability

Every pushed document includes a footer with:
- Push date
- Smart SDLC version
- Artifact file path

This ensures Confluence pages can always be traced back to the source artifact.

---

## GitHub

### Setup

**1. Authenticate the GitHub CLI:**

```bash
gh auth login
```

Follow the prompts to authenticate via browser.

**2. Enable in config:**

```yaml
# _superml/config.yml
github:
  enabled: true
  owner: "your-org"
  repo: "your-repo"
  default_base_branch: "main"
  branch_pattern: "{jira_key}-{story_slug}"
  pr_template: ".github/pull_request_template.md"
```

**3. Connect and verify:**

```
/sml-github-connect
```

### Skills

#### `/sml-github-create-branch` — Feature branch

Creates a branch following your configured `branch_pattern`. Default pattern:
```
PROJ-42-user-authentication
```

The Developer agent runs a conflict check (via JIRA) before creating the branch if `conflict_detection.check_git_branch_exists: true`.

#### `/sml-github-create-pr` — Pull request

Creates a PR from the current branch to `default_base_branch`. The AI fills in:
- Title from the story name
- Body from the PR template at `.github/pull_request_template.md`
- Links to the JIRA story (if JIRA enabled)
- Checklist items from the story acceptance criteria

### Branch Naming Convention

```yaml
branch_pattern: "{jira_key}-{story_slug}"
# Produces: PROJ-42-add-user-authentication

# Alternative patterns:
branch_pattern: "feature/{jira_key}-{story_slug}"
# Produces: feature/PROJ-42-add-user-authentication

branch_pattern: "{developer_name}/{jira_key}"
# Produces: nova/PROJ-42
```

---

## GitLab

### Setup

**1. Authenticate:**

```bash
glab auth login
```

**2. Enable in config:**

```yaml
gitlab:
  enabled: true
  namespace: "your-group/your-repo"
  default_base_branch: "main"
  branch_pattern: "{jira_key}-{story_slug}"
```

GitLab integration mirrors GitHub — the same branch creation and merge request patterns apply. Skills use `glab` CLI instead of `gh`.

---

## Azure DevOps

### Setup

**1. Log in:**

```bash
az login
az devops configure --defaults organization=https://dev.azure.com/your-org project="Your Project"
```

**2. Enable in config:**

```yaml
azure_devops:
  enabled: true
  organization: "https://dev.azure.com/your-org"
  project: "Your Project"
  default_area_path: "Your Project\\Team"
  default_iteration_path: "Your Project\\Sprint 1"
```

Azure DevOps uses `az devops work-item create` via the AI terminal. JIRA-equivalent skills (`jira-sync`, `jira-create-epic`) support Azure DevOps as an alternative backend — set `backend: azure_devops` in the skill invocation when prompted.

---

## Conflict Detection

Smart SDLC prevents parallel work conflicts by checking both JIRA and git before branch creation:

```yaml
conflict_detection:
  enabled: true
  check_jira_before_branch: true
  blocked_statuses: ["In Progress", "In Review", "Done"]
  check_git_branch_exists: true
```

When the Developer agent is about to create a branch:

1. Checks the JIRA ticket status — blocks if in a `blocked_statuses` state
2. Checks git remote for a branch with the same name — warns if it exists

This prevents two developers accidentally starting the same story.

---

## Reference Docs Loading

Beyond external system integrations, agents also load your internal company docs automatically:

```
_superml/reference/
├── all/                 Every persona reads these on every activation
│   ├── coding-standards.md
│   ├── glossary.md
│   └── company-context.md
├── product/             Loaded by Product / BA agent
├── architect/           Loaded by Architect agent
├── developer/           Loaded by Developer agent
├── modernization/       Loaded by Modernization Lead agent
└── team_lead/           Loaded by Team Lead agent
```

Drop any markdown files into these folders. Agents use them as company-specific context when writing PRDs, architecture docs, or reviewing code.

**Examples of what to put in reference:**
- `all/` — company glossary, product vision, tech stack guidelines
- `developer/` — coding standards, PR checklist, test coverage requirements
- `architect/` — preferred technology choices, non-negotiable constraints, security standards
- `product/` — brand voice, customer personas, design principles

---

## Company Knowledge

The Company Knowledge integration lets you register internal knowledge sources — framework documentation, platform library references, developer portals, internal wikis — and pull them into any AI session on demand.

This is distinct from `_superml/reference/`: reference is static markdown files you manage manually; Company Knowledge is live data fetched at runtime from URLs or MCP servers.

### Setup

```
/sml-company-knowledge-connect
```

The skill walks you through registering one or more sources. For each source you choose:

**Option A — URL**

Fetch documentation from any HTTP endpoint. Supports authentication modes:
- `none` — public endpoint
- `bearer` — `Authorization: Bearer <token>`
- `basic` — `Authorization: Basic <base64>`
- `header` — any custom header name + value

```yaml
# _superml/config.yml (auto-written by the skill)
company_knowledge:
  enabled: true
  sources:
    - key: spring-platform
      name: "Internal Spring Platform Docs"
      description: "Company Spring Boot wrapper — conventions, starters, and examples"
      access:
        type: url
        base_url: "https://devportal.internal/api/docs"
        auth:
          type: bearer
          token: "${DEVPORTAL_TOKEN}"
        response_format: markdown
      personas: all
```

**Option B — MCP Server**

Connect to a company MCP server. The skill generates the correct `.vscode/mcp.json` entry for:
- `npm_package` — an npm-published MCP server (e.g. `@yourorg/docs-mcp-server`)
- `url` — a hosted MCP endpoint
- `command` — a local CLI command

```yaml
# _superml/config.yml
company_knowledge:
  sources:
    - key: platform-docs
      name: "Platform Docs MCP"
      access:
        type: mcp
        server_name: "platform-docs"
      personas: [developer, architect]
```

The skill also warns you to add `.vscode/mcp.json` to `.gitignore`.

### Fetching a Source

```
/sml-company-knowledge-fetch
```

Lists your registered sources. You pick one (or pass a key/topic as an argument). The skill:
- For URL sources: constructs the request with the correct auth headers, formats the response by type (JSON, Markdown, HTML, plain text), and handles large responses
- For MCP sources: uses `@{server_name}` tool calls (list, get, search, show examples)

After fetching, the AI summarises what was loaded and suggests next actions: generate code from conventions, answer questions about the framework, compare against the current codebase, or incorporate into a story or architecture doc.

**Security**: tokens and passwords are never logged in AI output. Fetched content is never written to git-tracked files.
