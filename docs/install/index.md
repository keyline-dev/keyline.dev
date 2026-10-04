# Install

keyline is a free, source-available MCP server that lets AI agents (Claude Code, Cursor, Codex, VS Code) design social posts, display ads, banners, flyers and video at every size from one JSON scene. It measures text fit and overflow before rendering, and renders with Skia instead of a headless browser.

**Claude Code** (macOS or Linux): the plugin downloads keyline and checks it against the release's `SHA256SUMS`, or uses `keyline-mcp` from your PATH.

```text
/plugin marketplace add keyline-dev/keyline
/plugin install keyline@keyline
```

**Claude Desktop** (Mac with Apple silicon, or Windows): download `keyline-mcp-<version>.mcpb` from the [latest release](https://github.com/keyline-dev/keyline/releases/latest) and double-click it. Its settings choose the folders keyline may read.

## Other clients: install, then add

| | Install |
|---|---|
| macOS (Apple silicon) | `brew install keyline-dev/tap/keyline-mcp` |
| Linux (amd64, arm64) | `sudo apt install ./keyline-mcp_<version>-1_amd64.deb` (or `_arm64`), from the [latest release](https://github.com/keyline-dev/keyline/releases/latest); tarballs are there too |
| Windows (x64) | Unpack `keyline-mcp-v<version>-windows-amd64.zip` and put its folder on your PATH |
| Docker | Use `docker run -i --rm -v keyline:/data ghcr.io/keyline-dev/keyline-mcp` as the client's command; the `:stills` tag leaves out ffmpeg |
| From source | `cargo build --release` (Rust stable; on Linux also `libfontconfig1-dev libfreetype6-dev`) |

Every release has a `SHA256SUMS` file and build attestations: `gh attestation verify <file> --repo keyline-dev/keyline`. Then add keyline to your client. The command is `keyline-mcp`; if the client can't find it, give its full path (`which keyline-mcp`).

<details>
<summary><b>Cursor</b></summary>

[Add to Cursor](https://cursor.com/en/install-mcp?name=keyline&config=eyJjb21tYW5kIjoia2V5bGluZS1tY3AifQ%3D%3D), or add this to `~/.cursor/mcp.json`:

```json
{ "mcpServers": { "keyline": { "command": "keyline-mcp" } } }
```
</details>

<details>
<summary><b>VS Code</b></summary>

```sh
code --add-mcp '{"name":"keyline","command":"keyline-mcp"}'
```
</details>

<details>
<summary><b>Codex</b> (OpenAI)</summary>

```sh
codex mcp add keyline -- keyline-mcp
```
</details>

<details>
<summary><b>Gemini CLI</b> (Google)</summary>

```sh
gemini mcp add --scope user keyline keyline-mcp
```
</details>

<details>
<summary><b>Other clients</b></summary>

Most clients take this JSON, in the file below; links go to each client's guide.

```json
{ "mcpServers": { "keyline": { "command": "keyline-mcp" } } }
```

| Client | Where |
|---|---|
| Claude Code, without the plugin (and on Windows) | `claude mcp add --scope user keyline -- keyline-mcp` |
| Claude Desktop, without the `.mcpb` | Settings → Developer → Edit Config, with the full path (`/opt/homebrew/bin/keyline-mcp`); it doesn't read your shell's PATH |
| [Devin Desktop](https://docs.devin.ai/desktop/cascade/mcp) (Windsurf) | `~/.config/devin/mcp_config.json`; still named Windsurf: `~/.codeium/windsurf/mcp_config.json` |
| [Cline](https://docs.cline.bot/mcp/configuring-mcp-servers) | MCP Servers panel → `cline_mcp_settings.json` |
| [Antigravity](https://antigravity.google/docs/mcp) | `~/.gemini/config/mcp_config.json` |
| [Kiro](https://kiro.dev/docs/mcp/configuration/) | `~/.kiro/settings/mcp.json` |
| [JetBrains](https://www.jetbrains.com/help/ai-assistant/configure-an-mcp-server.html) AI Assistant, [Junie](https://junie.jetbrains.com/docs/junie-cli-mcp-configuration.html) | Settings → Tools → AI Assistant → MCP → Add; Junie: `~/.junie/mcp/mcp.json` |
| [GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/use-copilot-cli) | `/mcp add` in Copilot CLI |
| [Grok Build](https://docs.x.ai/build/features/mcp-servers) | `grok mcp add keyline -- keyline-mcp` |
| [opencode](https://opencode.ai/docs/mcp-servers/) | `opencode.json`: `"mcp": { "keyline": { "type": "local", "command": ["keyline-mcp"] } }` |
| [Warp](https://docs.warp.dev/knowledge-and-collaboration/mcp) | Settings → Agents → MCP servers → Add: `{ "keyline": { "command": "keyline-mcp" } }` |

Any client that starts stdio servers works. ChatGPT, grok.com and the xAI API connect only to remote servers, so they can't start keyline, which runs on your machine.
</details>

## Then

Ask your agent for a design: *"Make a vote-by-mail flyer with this photo, in 1080×1350, 1200×1000 and a 300×600 skyscraper."*

- **Local files:** let the agent add images and templates by path (cheaper than sending their bytes) with `--allow-read ~/brand ~/projects/ads`. Flags go after the command: `claude mcp add keyline -- keyline-mcp --allow-read ~/brand`, or in `args` in a JSON config. In Docker, mount the folder and allow the mount.
- **Video** needs [ffmpeg](https://ffmpeg.org) on the PATH; everything else, animated PNG and GIF included, works without it.
- **Options:** every setting is a flag (`--allow-read`, `--no-motion`, `--data`, `--fonts`, `--renderer`, `--ffmpeg`, `--encoder`); see `keyline-mcp --help` and [docs/tools.md](https://keyline.dev/docs/tools/index.md#server-configuration).
- **Without an agent:** `keyline-mcp render scene.json --out renders/` renders every size and exits 1 on a `!` defect; in GitHub Actions, `uses: keyline-dev/keyline@v0` does it for a repo's scenes ([details](https://keyline.dev/docs/tools/index.md#rendering-without-an-agent)).
- **GPU on a Linux server** needs Vulkan drivers (NVIDIA's, or Mesa); without a GPU, keyline renders on the CPU.
