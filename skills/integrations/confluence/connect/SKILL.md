---
name: confluence-connect
description: "Set up and verify Confluence integration. Use when the user says 'connect to Confluence', 'set up Confluence', or 'configure Confluence'."
---

# Confluence — Connect and Verify

## Goal

Validate Confluence connectivity and store working credentials so push-doc and sync operations work without re-prompting.

---

## Security Check First

Confirm `_superml/config.yml` is in `.gitignore` before proceeding (same check as `jira-connect`).

---

## Step 1: Collect Confluence Details

Ask:
1. **Confluence base URL**: e.g., `https://yourorg.atlassian.net/wiki`
2. **Space key**: e.g., `ENG` or `PROD` — the key of the space to publish docs to
3. **Email** (if not already in JIRA config)
4. **API token** (same Atlassian token as JIRA — share if already configured)

---

## Step 2: Verify Connectivity

```bash
curl -s \
  "{confluence_url}/rest/api/space/{space_key}" \
  -u "{email}:{api_token}" \
  -H "Accept: application/json" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print('✅ Connected to space:', d['name'])
print('Space key:', d['key'])
"
```

If fails, list available spaces:
```bash
curl -s \
  "{confluence_url}/rest/api/space?type=global&limit=20" \
  -u "{email}:{api_token}" \
  -H "Accept: application/json" | python3 -c "
import sys, json
results = json.load(sys.stdin)['results']
[print(s['key'], '-', s['name']) for s in results]
"
```

⏸️ **STOP** — connectivity must succeed before saving.

---

## Step 3: Set Parent Page (Optional)

Ask: "Should published docs go under a specific parent page? (enter page title or leave blank for space root)"

If provided, find the page ID:
```bash
curl -s \
  "{confluence_url}/rest/api/content?title={encoded_title}&spaceKey={space_key}" \
  -u "{email}:{api_token}" \
  -H "Accept: application/json" | python3 -c "
import sys, json
results = json.load(sys.stdin)['results']
print('Page ID:', results[0]['id']) if results else print('Page not found')
"
```

---

## Step 4: Save to Config

```yaml
integrations:
  confluence:
    url: "{confluence_url}"
    space_key: "{space_key}"
    parent_page_id: "{page_id_or_empty}"
    email: "{email}"
    api_token: "{api_token}"
```

---

## Completion

> "✅ Confluence connected.
> Space: {space_name} ({space_key})
>
> Available skills:
> - `confluence-push-doc` — push any planning artifact as a Confluence page
> - `confluence-sync` — keep docs in sync with local changes"
