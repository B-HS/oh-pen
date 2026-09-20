<div align="center">

<img src="docs/assets/app-icon.svg" alt="oh-pencode icon" width="112" />

# oh-pencode

**A single `pen` primary agent for OpenCode V2 — with six specialized subagents.**

`build` and `plan` hidden. Auto-mode. Per-role model assignment. Verified installs.

[Install](#install) · [Agents](#agents) · [Usage](#usage) · [Development](#development) · [Docs](#docs)

</div>

oh-pencode installs a single primary agent, `pen`, into the global OpenCode V2 config directory. `pen` replaces the built-in `build` and `plan` agents, decides when delegation is useful, and completes requested implementation through verification, commit, and normal push without routine approval prompts. Six specialized subagents cover execution, research, codebase exploration, official documentation, independent verification, and security review. Each role may use a convention default, inherit the primary model, or use any connected OpenCode `provider/model#variant` selected during installation.

## Install

```bash
curl -fsSL https://b-hs.github.io/oh-pen/install.sh | bash
```

Preview without writing any file:

```bash
curl -fsSL https://b-hs.github.io/oh-pen/install.sh | bash -s -- --dry-run
```

Non-interactive install with convention model defaults:

```bash
curl -fsSL https://b-hs.github.io/oh-pen/install.sh | bash -s -- --no-interview
```

Verify or remove:

```bash
curl -fsSL https://b-hs.github.io/oh-pen/install.sh | bash -s -- verify
curl -fsSL https://b-hs.github.io/oh-pen/install.sh | bash -s -- uninstall
```

Requirements

- OpenCode V2 (`opencode --version`)
- Bun (`bun --version`)

The installer downloads `install.sh`, `manifest.json`, and every asset listed in the manifest, verifies each SHA-256 hash recorded in the manifest, and only then runs the bundled installer. A hash mismatch stops the install before any file is written.

## Agents

| Agent | Mode | Role | Permissions |
| --- | --- | --- | --- |
| `pen` | primary | Orchestrates or executes, integrates results, owns verification and Git | Project tools and normal commit/push; force push denied |
| `sub-pen` | subagent | Executes a detailed work contract within an assigned scope | Project tools; Git mutation and nested subagents denied |
| `research-pen` | subagent | Investigates facts, constraints, and prerequisites before implementation | Read, search, web |
| `explore-pen` | subagent | Finds patterns, symbols, and structure in a codebase | Read, search only, no network |
| `doc-pen` | subagent | Extracts official usage and API contracts, then saves reusable guidance | Read, search, web, edit under `docs/**` only |
| `verify-pen` | subagent | Runs the smallest independent verification that covers a change's risk | Read, search, shell; no source or Git mutation |
| `security-pen` | subagent | Audits secrets, auth, injection, and dependencies | Read, search, web, package-manager audit commands |

`build` and `plan` are installed as hidden stubs so the pen set owns the primary slot. The installer writes only under `~/.config/opencode/`.

## Usage

1. Start a new OpenCode session. `pen` is the default agent.
2. Give the task directly. `pen` classifies read-only and mutating requests, then decides whether direct execution or delegation is more appropriate.
3. For change requests, `pen` completes implementation, proportional verification, selective staging, commit, and normal push. It asks only when new authority, secrets, a user-visible contract decision, or a destructive operation is required.

Model assignment

- The installer supports convention defaults, primary-model inheritance, or direct `provider/model#variant` input for every agent.
- Subagent models are set in `~/.config/opencode/agents/<id>.md` on the `model:` line. Any model connected to OpenCode can be selected, and changes take effect on the next child-session request.
- The primary session model is fixed by the root `model` key in `~/.config/opencode/opencode.jsonc`. A `model:` field in `agents/pen.md` has no effect on the primary session.
- `pen` uses the installed assignment without asking on every task. A user-provided model override is applied only when explicitly requested; unavailable models are reported instead of silently replaced.
- Reinstall and upgrade preserve a user-edited `model:` line while refreshing the managed agent prompt and permissions. Other manual prompt edits remain fully preserved unless `--force` is used.

Documentation workflow

- `doc-pen` prioritizes official sources and records reusable setup, configuration, API usage, defaults, version differences, and project-specific cautions under `docs/**`.
- It follows an existing documentation taxonomy when possible and falls back to `docs/references/<topic>.md`.
- One-off facts and duplicate material are returned to `pen` without creating another file.

## Development

```bash
bun install
bun run typecheck
bun run build:site                              # generates dist/
bun run src/cli.ts install --assets-dir ./dist/assets --dry-run --no-interview
bun run src/cli.ts verify
bun run install:local -- --dry-run --no-interview   # exercises the built dist/ through the --base-url path
```

`--assets-dir` points directly at a local asset directory, while `--base-url ./dist` reads the built `dist/manifest.json` and its `assets/` tree. Both are development-only flags. Release installs fetch the published site instead.

### Deployment

Pushing to `main` runs `typecheck` and `build:site` in GitHub Actions and publishes `dist/` to GitHub Pages. `bun run build:site` regenerates `dist/` from scratch, records SHA-256 hashes for the bundle and every asset in `dist/manifest.json`, and emits the bootstrap `install.sh` that verifies those hashes at install time.

## Docs

| Document | Purpose |
| --- | --- |
| `docs/opencode/v2-agents.md` | OpenCode V2 agent contract (measured behavior included) |
| `docs/opencode/v2-install-surface.md` | Install points, precedence, and idempotency |
| `docs/pen/architecture.md` | Agent set design |
| `docs/pen/installer.md` | Installer design |
| `docs/acknowledge/decisions.md` | Decisions and agreements |
| `docs/PROCESS.md` | Work state |

## Safety

- Writes only under `~/.config/opencode/`.
- Backs up `opencode.jsonc` and every managed agent file before writing.
- Preserves agent files that the user edited after installation, and reports them.
- Rejects asset paths containing `..` or absolute paths, so a tampered manifest cannot escape the config directory.
- Accepts only `https` or local paths as an asset source.
- Does not read secrets, tokens, or `.env` files.
- Does not use `sudo`.
