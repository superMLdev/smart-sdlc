---
name: jira-connect
description: "Set up and verify JIRA integration. Use when the user says 'connect to JIRA', 'set up JIRA', or 'configure JIRA'."
---

# JIRA — Connect and Verify

## Goal

Validate JIRA connectivity and store working credentials in `_superml/config.yml` so all other JIRA skills work without re-prompting.

---

## Important: Credential Security

Credentials go in `{project-root}/_superml/config.yml` which **must** be in `.gitignore`.

Before proceeding, verify:
```bash
cat {project-root}/.gitignore | grep _superml
```

If not present, add it:
```bash
echo "_superml/config.yml" >> {project-root}/.gitignore
```

⏸️ **STOP** — confirm `.gitignore` is updated before collecting any credentials.

---

## Step 1: Collect JIRA Details

Ask the user:
1. **JIRA base URL**: e.g., `https://yourorg.atlassian.net`
2. **JIRA project key**: e.g., `PROJ` (the prefix on all tickets)
3. **Your JIRA email**: the email on the Atlassian account
4. **API token**: Generate at https://id.atlassian.com/manage-profile/security/api-tokens

---

## Step 2: Test Connectivity

Run the following to verify the credentials work:

```bash
curl -s -u "{email}:{api_token}" \
  "{jira_url}/rest/api/3/project/{project_key}" \
  -H "Accept: application/json" | python3 -c "import sys,json; d=json.load(sys.stdin); print('✅ Connected to:', d['name'])"
```

If the command fails, show the error and suggest:
- API token may be expired → generate a new one
- Project key may be wrong → list projects to find the right key
- URL may be missing or wrong

List available projects if key is unknown:
```bash
curl -s -u "{email}:{api_token}" \
  "{jira_url}/rest/api/3/project/search" \
  -H "Accept: application/json" | python3 -c "import sys,json; [print(p['key'], '-', p['name']) for p in json.load(sys.stdin)['values']]"
```

⏸️ **STOP** — connectivity must succeed before saving.

---

## Step 3: Save to Config

Update `{project-root}/_superml/config.yml`:

```yaml
integrations:
  jira:
    url: "{jira_url}"
    project_key: "{project_key}"
    email: "{email}"
    api_token: "{api_token}"
    issue_types:
      epic: "Epic"
      story: "Story"
      task: "Task"
      bug: "Bug"
```

---

## Step 4: Confirm

> "✅ JIRA connected.
> Project: {project_name} ({project_key})
> URL: {jira_url}
>
> Available JIRA skills:
> - `jira-create-epic` — create epics from your planning artifacts
> - `jira-create-story` — create individual stories
> - `jira-sync` — bulk sync all epics and stories
> - `jira-conflict-detect` — check if a story is already claimed"
