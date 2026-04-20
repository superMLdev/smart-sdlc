---
name: help
description: "Context-aware guidance on what to do next. Use when the user says 'help', 'what do I do next', 'where do I start', or 'I'm stuck'."
---

# Agentic SDLC — Contextual Help

## What This Is

Agentic SDLC is an AI-driven development skills framework built by Superml.dev & superml.org by crazyaiml. You load a skill, and your AI assistant executes it as a structured workflow with step-by-step guidance.

---

## Finding Your Way Based on What You Have

### "I have a product idea — where do I start?"

1. Load **Aria (Business Analyst)**: `agent-analyst`
2. Use: **PB** — Product Brief
3. Then: **PRD** — Create PRD

---

### "I have a PRD — what next?"

1. Load **Rex (System Architect)**: `agent-architect`
2. Use: **CA** — Create Architecture
3. Then: **ES** — Create Epics & Stories
4. Optionally sync to JIRA: `jira-sync`

---

### "I have a backlog — let's start building"

1. Load **Nova (Developer)**: `agent-developer`
2. Use: **SP** — Sprint Planning
3. Then: **DS** — Implement Story (TDD)

---

### "I need to analyze an existing codebase"

1. Load **Aria (Business Analyst)**: `agent-analyst`
2. Use: **AP** — Analyze Existing Project

---

### "I want to connect JIRA / Confluence / GitHub"

1. Invoke: `jira-connect` (for JIRA)
2. Invoke: `confluence-connect` (for Confluence)
3. Invoke: `github-connect` (for GitHub)

These store credentials in `_superml/config.yml` (git-ignored).

---

## All Agents

| Agent | Persona | Load With | Best For |
|-------|---------|-----------|----------|
| Aria | Business Analyst 📊 | `agent-analyst` | Research, briefs, requirements |
| Leo | Product Manager 📋 | `agent-pm` | PRDs, prioritization |
| Rex | System Architect 🏗️ | `agent-architect` | Architecture, epics, stories |
| Nova | Senior Engineer 💻 | `agent-developer` | Implementation, TDD, code review |

---

## All Skills

See `module.yaml` for the complete skill registry.

---

## Setup

If you haven't set up yet:
1. Copy `config/config.example.yml` → `_superml/config.yml` in your project root
2. Fill in your name, project details, and any integration credentials
3. Add `_superml/config.yml` to `.gitignore`
