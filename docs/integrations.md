# Integrations — Smart SDLC

Smart SDLC connects to external systems via CLI tools your AI assistant runs in the terminal. No API keys are embedded in skills — credentials are stored in `_superml/config.yml` (git-ignored).

---

## Supported Integrations

| System | What It Does | CLI Tool Required |
|---|---|---|
| **JIRA** | Create epics/stories, sync backlog, detect conflicts | `curl` + JIRA REST API |
| **Confluence** | Push planning docs, sync PRDs and architecture | `curl` + Confluence REST API |
| **GitHub** | Create branches, open PRs, link commits | `gh` CLI |
| **GitLab** | Create branches, open merge requests | `glab` CLI |
| **Azure DevOps** | Create work items, manage sprints | `az devops` (Azure CLI) |

All integrations are **opt-in**. Set `enabled: true` in the relevant section of `_superml/config.yml`.

---

## JIRA

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
