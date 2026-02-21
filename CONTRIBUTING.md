# Contributing

Thanks for your interest in contributing to **GitHub Labels Template**! Here's how to get started.

## Prerequisites

- [Bun](https://bun.sh) (v1.0+)
- [GitHub CLI](https://cli.github.com) (`gh`) installed and authenticated

## Setup

```bash
git clone https://github.com/warengonzaga/github-labels-template.git
cd github-labels-template
bun install
```

## Development

```bash
# Run the CLI locally
bun src/index.ts apply --help

# Build for production
bun run build

# Test the built output via Node
node dist/index.js --help
```

## Commit Convention

This project follows the [Clean Commit](https://github.com/wgtechlabs/clean-commit) workflow. Every commit message must use one of the 9 types:

| Emoji | Type | Use for |
|:-----:|------|---------|
| 📦 | `new` | New features, files, or capabilities |
| 🔧 | `update` | Changing existing code, improvements |
| 🗑️ | `remove` | Removing code, files, or dependencies |
| 🔒 | `security` | Security fixes and patches |
| ⚙️ | `setup` | Configs, CI/CD, tooling, build systems |
| ☕ | `chore` | Maintenance, dependency updates |
| 🧪 | `test` | Adding or updating tests |
| 📖 | `docs` | Documentation changes |
| 🚀 | `release` | Version releases |

**Format:**

```
<emoji> <type>: <description>
<emoji> <type> (<scope>): <description>
```

**Examples:**

```
📦 new: add dry-run mode to apply command
🔧 update (cli): improve error messages for missing gh auth
📖 docs: add usage examples to README
```

## Pull Requests

1. Fork the repository
2. Create a feature branch from `dev`
3. Make your changes
4. Ensure `bun run build` succeeds
5. Commit using Clean Commit convention
6. Open a PR against `dev`

> **Note:** All contributions should target the `dev` branch, not `main`. The `main` branch is reserved for releases.

## Reporting Issues

Found a bug or have a feature request? [Open an issue](https://github.com/warengonzaga/github-labels-template/issues/new) with as much detail as possible.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
