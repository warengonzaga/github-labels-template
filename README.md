# GitHub Labels Template

![GitHub Repo Banner](https://ghrb.waren.build/banner?header=GitHub+Labels+Template+%F0%9F%8F%B7%EF%B8%8F&subheader=A+curated+set+of+GitHub+labels+for+any+project+%E2%80%94+CLI-ready.&bg=013B84-016EEA&color=FFFFFF&headerfont=Google+Sans+Code&subheaderfont=Sour+Gummy&support=true)
<!-- Created with GitHub Repo Banner by Waren Gonzaga: https://ghrb.waren.build -->

A CLI tool to apply a curated set of GitHub labels to any repository using `gh` CLI.

[![License: CC0-1.0](https://img.shields.io/badge/License-CC0--1.0-blue.svg)](https://creativecommons.org/publicdomain/zero/1.0/)
[![npm version](https://img.shields.io/npm/v/github-labels-template.svg)](https://www.npmjs.com/package/github-labels-template)

## Features

- 🏷️ **21 Curated Labels**: Organized across 5 categories — type, status, community, resolution, and area
- 🚀 **One Command Setup**: Apply all labels to any repo with `ghlt apply`
- 🔍 **Auto-Detect Repo**: Automatically detects the current repository from git remote
- 🔄 **Smart Conflict Handling**: Skips existing labels by default, `--force` to update
- 🧹 **Wipe Command**: Remove all existing labels with a confirmation prompt
- ✅ **Pre-Flight Checks**: Validates `gh` CLI is installed and authenticated before doing anything
- 📊 **Clear Output**: Structured logging powered by [@wgtechlabs/log-engine](https://github.com/wgtechlabs/log-engine) with color-coded levels and emoji
- 🎨 **ASCII Banner**: Beautiful ANSI Shadow figlet banner with version and author info
- 🤖 **AI Label Generator**: Generate custom labels using GitHub Copilot — interactive pick, refine, and apply
- 🌐 **Dual Runtime**: Works with both `npx` and `bunx`

## Quick Start

```bash
# Using npx
npx github-labels-template apply

# Using bunx
bunx github-labels-template apply
```

That's it. All 21 labels are applied to the current repo.

## Installation

```bash
# Global install (npm)
npm install -g github-labels-template

# Global install (bun)
bun install -g github-labels-template

# Then use anywhere
ghlt apply
```

## Prerequisites

- [GitHub CLI](https://cli.github.com) (`gh`) installed and authenticated
- [GitHub Copilot](https://github.com/features/copilot) subscription (required for `generate` command only)

## Usage

### Apply Labels

```bash
# Apply to the current repo (auto-detected from git remote)
ghlt apply

# Apply to a specific repo
ghlt apply --repo owner/repo

# Overwrite existing labels with template values
ghlt apply --force

# Apply only a specific label
ghlt apply --label bug

# Apply specific labels (comma-separated)
ghlt apply --label "bug,enhancement"

# Apply all labels from a category
ghlt apply --category type

# Apply labels from multiple categories
ghlt apply --category "type,status"

# Combine: apply all community labels + the "bug" label
ghlt apply --category community --label bug

# Combine with force and repo
ghlt apply --category type --force --repo owner/repo

# Include custom labels from labels-custom.json
ghlt apply --custom

# Apply only custom labels from a specific category
ghlt apply --custom --category type
```

### Generate Labels (AI)

Generate custom labels using GitHub Copilot. Requires a [GitHub Copilot](https://github.com/features/copilot) subscription.

```bash
# Interactive label generator
ghlt generate

# Pre-select a category
ghlt generate --category type

# Generate and apply to a specific repo
ghlt generate --repo owner/repo
```

The generator will:
1. Ask you to pick a category (type, status, community, resolution, area)
2. Ask you to describe the label you need
3. Generate 3 AI-powered suggestions following the template conventions
4. Let you pick one, refine with feedback, or regenerate
5. Save to `labels-custom.json` and optionally apply to a repo

### Wipe Labels

```bash
# Remove all labels (with confirmation prompt)
ghlt wipe

# Remove all labels from a specific repo
ghlt wipe --repo owner/repo

# Skip confirmation prompt
ghlt wipe --yes
```

### Common Workflows

```bash
# Clean slate: wipe defaults, then apply template
ghlt wipe --yes && ghlt apply

# Update a specific repo to match the template
ghlt apply --repo owner/repo --force
```

## Label Template

### Type Labels

Classify what kind of work this is.

| Name | Color | Description |
|------|-------|-------------|
| `bug` | ![#d73a4a](https://placehold.co/12x12/d73a4a/d73a4a.png) `d73a4a` | Something isn't working |
| `enhancement` | ![#1a7f37](https://placehold.co/12x12/1a7f37/1a7f37.png) `1a7f37` | New feature or improvement to existing functionality |
| `documentation` | ![#0075ca](https://placehold.co/12x12/0075ca/0075ca.png) `0075ca` | Improvements or additions to docs, README, or guides |
| `refactor` | ![#8957e5](https://placehold.co/12x12/8957e5/8957e5.png) `8957e5` | Code improvement without changing functionality |
| `performance` | ![#e3795c](https://placehold.co/12x12/e3795c/e3795c.png) `e3795c` | Optimization, speed, or resource usage improvements |
| `security` | ![#d4a72c](https://placehold.co/12x12/d4a72c/d4a72c.png) `d4a72c` | Security vulnerability or hardening |

### Status Labels

Track the current workflow state.

| Name | Color | Description |
|------|-------|-------------|
| `blocked` | ![#cf222e](https://placehold.co/12x12/cf222e/cf222e.png) `cf222e` | Waiting on another issue, decision, or external factor |
| `needs triage` | ![#e16f24](https://placehold.co/12x12/e16f24/e16f24.png) `e16f24` | New issue — needs review and categorization |
| `awaiting response` | ![#1a7ec7](https://placehold.co/12x12/1a7ec7/1a7ec7.png) `1a7ec7` | Waiting for more information from the reporter |
| `ready` | ![#2da44e](https://placehold.co/12x12/2da44e/2da44e.png) `2da44e` | Triaged and ready to be picked up |

### Community Labels

Signals for open source contributors.

| Name | Color | Description |
|------|-------|-------------|
| `good first issue` | ![#7057ff](https://placehold.co/12x12/7057ff/7057ff.png) `7057ff` | Good for newcomers — well-scoped and documented |
| `help wanted` | ![#0e8a16](https://placehold.co/12x12/0e8a16/0e8a16.png) `0e8a16` | Open for community contribution |
| `maintainer only` | ![#b60205](https://placehold.co/12x12/b60205/b60205.png) `b60205` | Reserved for maintainers — not open for external contribution |

### Resolution Labels

Why an issue or PR was closed.

| Name | Color | Description |
|------|-------|-------------|
| `duplicate` | ![#cfd3d7](https://placehold.co/12x12/cfd3d7/cfd3d7.png) `cfd3d7` | This issue or pull request already exists |
| `invalid` | ![#cfd3d7](https://placehold.co/12x12/cfd3d7/cfd3d7.png) `cfd3d7` | This doesn't seem right |
| `wontfix` | ![#cfd3d7](https://placehold.co/12x12/cfd3d7/cfd3d7.png) `cfd3d7` | This will not be worked on |

### Area Labels

Broad software layers — universal across any project.

| Name | Color | Description |
|------|-------|-------------|
| `core` | ![#0052cc](https://placehold.co/12x12/0052cc/0052cc.png) `0052cc` | Core logic, business rules, and primary functionality |
| `interface` | ![#5319e7](https://placehold.co/12x12/5319e7/5319e7.png) `5319e7` | User-facing layer — UI, CLI, API endpoints, or SDK surface |
| `data` | ![#006b75](https://placehold.co/12x12/006b75/006b75.png) `006b75` | Database, storage, caching, or data models |
| `infra` | ![#e16f24](https://placehold.co/12x12/e16f24/e16f24.png) `e16f24` | Build system, CI/CD, deployment, config, and DevOps |
| `testing` | ![#1a7f37](https://placehold.co/12x12/1a7f37/1a7f37.png) `1a7f37` | Unit tests, integration tests, E2E, and test tooling |

## CLI Reference

```
ghlt — GitHub Labels Template CLI

USAGE
  ghlt [OPTIONS] apply|wipe|generate

OPTIONS
  -v, --version              Show version number

COMMANDS
  apply      Apply labels from the template to a repository
  wipe       Remove all existing labels from a repository
  generate   Generate custom labels using AI (requires GitHub Copilot)

OPTIONS (apply)
  -r, --repo <owner/repo>   Target repository (default: auto-detect)
  -f, --force                Overwrite existing labels
  -l, --label <name>         Apply specific label(s) by name (comma-separated)
  -c, --category <name>      Apply labels from specific category(ies) (comma-separated)
      --custom               Include custom labels from labels-custom.json

OPTIONS (generate)
  -r, --repo <owner/repo>   Target repository for optional apply step
  -c, --category <name>      Pre-select a category (type, status, community, resolution, area)

OPTIONS (wipe)
  -r, --repo <owner/repo>   Target repository (default: auto-detect)
  -y, --yes                  Skip confirmation prompt
```

## Testing

This project uses the [Bun test framework](https://bun.sh/docs/cli/test) for testing.

```bash
# Run all tests
bun test
```

## Contributing

Contributions are welcome! This project follows the [Clean Commit](https://github.com/wgtechlabs/clean-commit) convention.

## License

This project is licensed under the [CC0 1.0 Universal](LICENSE).

## Author

**Waren Gonzaga**

[![GitHub](https://img.shields.io/badge/GitHub-@warengonzaga-181717?logo=github)](https://github.com/warengonzaga)
