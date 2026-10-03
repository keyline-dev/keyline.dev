# Install

keyline is a free, source-available MCP server that lets AI agents (Claude Code, Cursor, Codex, VS Code) design social posts, display ads, banners, flyers and video at every size from one JSON scene. It measures text fit and overflow before rendering, and renders with Skia instead of a headless browser.

## Claude Code and Claude Desktop

Nothing else to install.

**Claude Code:** install the plugin. It uses `keyline-mcp` from your PATH if it's there, and otherwise downloads the matching release once and checks it against the release's `SHA256SUMS`.

```text
/plugin marketplace add keyline-dev/keyline
/plugin install keyline@keyline
```

**Claude Desktop** (Mac with Apple silicon, or Windows): download `keyline-mcp-<version>.mcpb` from the [latest release](https://github.com/keyline-dev/keyline/releases/latest) and double-click it. Its settings pick the folders keyline may read and whether to leave motion out.

## Other clients: install, then add

**macOS** (Apple silicon):

```sh
brew install keyline-dev/tap/keyline-mcp
```

Or download `keyline-mcp-<version>-macos-arm64.tar.gz` from the [latest release](https://github.com/keyline-dev/keyline/releases/latest) and put the binary on your PATH. It isn't signed by Apple, so if you downloaded it in a browser, clear the quarantine flag once:

```sh
tar xzf keyline-mcp-<version>-macos-arm64.tar.gz
sudo mv keyline-mcp-<version>-macos-arm64/keyline-mcp /usr/local/bin/
xattr -d com.apple.quarantine /usr/local/bin/keyline-mcp 2>/dev/null || true
```

**Linux** (amd64 or arm64): the `.deb` from the [latest release](https://github.com/keyline-dev/keyline/releases/latest) puts `keyline-mcp` in `/usr/bin`; a plain tarball is there too.

```sh
sudo apt install ./keyline-mcp_<version>-1_amd64.deb
```

**Windows** (x64; Arm runs it emulated): download `keyline-mcp-<version>-windows-amd64.zip` from the [latest release](https://github.com/keyline-dev/keyline/releases/latest), unpack it, and put the folder holding `keyline-mcp.exe` on your PATH, or give clients its full path. The Claude Code plugin doesn't run on Windows yet; add the server with `claude mcp add keyline -- keyline-mcp` instead.

**Docker** (Linux, nothing else to install): use this as the command in your client. `:latest` includes ffmpeg for video; `:stills` leaves it out and is about a third the size.

```sh
docker run -i --rm -v keyline:/data ghcr.io/keyline-dev/keyline-mcp
```

**From source** (any OS; Rust stable; Skia comes precompiled; on Linux also `libfontconfig1-dev libfreetype6-dev`): `cargo build --release`.

To check a download, compare it with the release's `SHA256SUMS`, or check where it was built with the [GitHub CLI](https://cli.github.com); then check it runs with `keyline-mcp --help`:

```sh
sha256sum --check --ignore-missing SHA256SUMS      # macOS: shasum -a 256 --check --ignore-missing SHA256SUMS
gh attestation verify keyline-mcp_<version>-1_amd64.deb --repo keyline-dev/keyline
```

Then add it to your client. Each block names the server `keyline`; clients prefix its tools with that name, so a short one costs fewer tokens. If a client can't find the program, give its full path (`which keyline-mcp`).

<details>
<summary><b>Claude Code</b>, without the plugin</summary>

```sh
claude mcp add keyline -- keyline-mcp
```

Add `--scope user` to use it in every project. ([guide](https://code.claude.com/docs/en/mcp))
</details>

<details>
<summary><b>Claude Desktop</b>, without the extension</summary>

Settings → Developer → Edit Config opens `claude_desktop_config.json`. Claude Desktop doesn't search your shell's PATH, so give the full path, then restart it. ([guide](https://modelcontextprotocol.io/quickstart/user))

```json
{ "mcpServers": { "keyline": { "command": "/opt/homebrew/bin/keyline-mcp" } } }
```
</details>

<details>
<summary><b>Cursor</b></summary>

[Add to Cursor](https://cursor.com/en/install-mcp?name=keyline&config=eyJjb21tYW5kIjoia2V5bGluZS1tY3AifQ%3D%3D), or add to `~/.cursor/mcp.json` (every project) or `.cursor/mcp.json` (one project). ([guide](https://cursor.com/docs/context/mcp))

```json
{ "mcpServers": { "keyline": { "command": "keyline-mcp" } } }
```
</details>

<details>
<summary><b>VS Code</b></summary>

```sh
code --add-mcp '{"name":"keyline","command":"keyline-mcp"}'
```

Or add to `.vscode/mcp.json`, or your profile's (*MCP: Open User Configuration*). The key is `servers`, not `mcpServers`. ([guide](https://code.visualstudio.com/docs/copilot/customization/mcp-servers))

```json
{ "servers": { "keyline": { "type": "stdio", "command": "keyline-mcp" } } }
```
</details>

<details>
<summary><b>Devin Desktop</b> (formerly Windsurf)</summary>

Add to `~/.config/devin/mcp_config.json` (Windows: `%APPDATA%\devin\mcp_config.json`); versions still named Windsurf read `~/.codeium/windsurf/mcp_config.json`. ([guide](https://docs.devin.ai/desktop/cascade/mcp))

```json
{ "mcpServers": { "keyline": { "command": "keyline-mcp" } } }
```
</details>

<details>
<summary><b>Cline</b></summary>

In Cline's MCP Servers panel, open the installed servers' settings (`cline_mcp_settings.json`) and add: ([guide](https://docs.cline.bot/mcp/configuring-mcp-servers))

```json
{ "mcpServers": { "keyline": { "command": "keyline-mcp" } } }
```
</details>

<details>
<summary><b>Codex</b> (OpenAI)</summary>

```sh
codex mcp add keyline -- keyline-mcp
```

Or add to `~/.codex/config.toml`: ([guide](https://developers.openai.com/codex/mcp))

```toml
[mcp_servers.keyline]
command = "keyline-mcp"
```

The ChatGPT app itself connects only to remote MCP servers over HTTP, so it can't start keyline, which runs on your machine; use Codex.
</details>

<details>
<summary><b>Gemini CLI</b> (Google)</summary>

```sh
gemini mcp add --scope user keyline keyline-mcp
```

Or add to `~/.gemini/settings.json`, then check with `/mcp` in Gemini CLI: ([guide](https://geminicli.com/docs/tools/mcp-server/))

```json
{ "mcpServers": { "keyline": { "command": "keyline-mcp" } } }
```
</details>

<details>
<summary><b>Antigravity</b> (Google)</summary>

Add to `~/.gemini/config/mcp_config.json` (every workspace) or `.agents/mcp_config.json` (one workspace). ([guide](https://antigravity.google/docs/mcp))

```json
{ "mcpServers": { "keyline": { "command": "keyline-mcp" } } }
```
</details>

<details>
<summary><b>GitHub Copilot CLI</b></summary>

Run `/mcp add` in Copilot CLI, or add to `~/.copilot/mcp-config.json`: ([guide](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/use-copilot-cli))

```json
{ "mcpServers": { "keyline": { "type": "local", "command": "keyline-mcp", "args": [], "tools": ["*"] } } }
```
</details>

<details>
<summary><b>Grok Build</b> (xAI)</summary>

```sh
grok mcp add keyline -- keyline-mcp
```

Or add to `~/.grok/config.toml`, then check with `grok mcp doctor keyline`: ([guide](https://docs.x.ai/build/features/mcp-servers))

```toml
[mcp_servers.keyline]
command = "keyline-mcp"
```

grok.com and the xAI API connect only to remote MCP servers, so they can't start keyline; use Grok Build.
</details>

<details>
<summary><b>Kiro</b></summary>

Add to `~/.kiro/settings/mcp.json` (every workspace) or `.kiro/settings/mcp.json` (one workspace). ([guide](https://kiro.dev/docs/mcp/configuration/))

```json
{ "mcpServers": { "keyline": { "command": "keyline-mcp" } } }
```
</details>

<details>
<summary><b>opencode</b></summary>

Add to `~/.config/opencode/opencode.json`, or `opencode.json` in a project. The command is a list. ([guide](https://opencode.ai/docs/mcp-servers/))

```json
{ "$schema": "https://opencode.ai/config.json", "mcp": { "keyline": { "type": "local", "command": ["keyline-mcp"] } } }
```
</details>

<details>
<summary><b>JetBrains</b> (AI Assistant and Junie)</summary>

AI Assistant: Settings → Tools → AI Assistant → Model Context Protocol (MCP) → Add, and paste the JSON below. ([guide](https://www.jetbrains.com/help/ai-assistant/configure-an-mcp-server.html)) Junie: run `/mcp`, or add the same JSON to `~/.junie/mcp/mcp.json`. ([guide](https://junie.jetbrains.com/docs/junie-cli-mcp-configuration.html))

```json
{ "mcpServers": { "keyline": { "command": "keyline-mcp", "args": [] } } }
```
</details>

<details>
<summary><b>Warp</b></summary>

Settings → Agents → MCP servers → Add, and paste: ([guide](https://docs.warp.dev/knowledge-and-collaboration/mcp))

```json
{ "keyline": { "command": "keyline-mcp", "args": [] } }
```
</details>

<details>
<summary><b>Any other client</b></summary>

Any MCP client that starts stdio servers works: the command is `keyline-mcp`. It runs where the client runs; to render on another machine, make the command `ssh that-machine keyline-mcp`.
</details>

## Then

Ask your agent for a design: *"Make a vote-by-mail flyer with this photo, in 1080×1350, 1200×1000 and a 300×600 skyscraper."*

**Local files:** to let the agent add images and templates by path (their bytes never pass through the model, far cheaper than base64), allow their folders: `--allow-read ~/brand ~/projects/ads`. With `claude mcp add`, flags go after the command (`claude mcp add keyline -- keyline-mcp --allow-read ~/brand`); in a JSON config, in `args`. Paths are resolved through every symlink before the check. In Docker, mount the folder and allow the mount: `-v ~/brand:/brand … --allow-read /brand`.

**Video** needs [ffmpeg](https://ffmpeg.org) (`brew install ffmpeg`, `apt install ffmpeg`), looked up when a call needs it. It's optional: without it, everything else works, animated PNG and GIF included.

**Options:** every setting is a flag (`--allow-read`, `--no-motion`, `--data`, `--fonts`, `--renderer`, `--ffmpeg`, `--encoder`), listed in [docs/tools.md](https://keyline.dev/docs/tools/index.md#server-configuration) and by `keyline-mcp --help`.

**Without an agent:** `keyline-mcp render scene.json --out renders/` renders a scene file at every size, and exits 1 on a `!` defect, for scripts and CI (`--check` checks without drawing); in GitHub Actions, `uses: keyline-dev/keyline@v0` does it for every scene in a repo ([docs/tools.md](https://keyline.dev/docs/tools/index.md#rendering-without-an-agent)).

**GPU on a Linux server:** it needs a GPU with Vulkan drivers (NVIDIA's, or Mesa for AMD and Intel); no display is needed. In Docker, pass the GPU through (for NVIDIA: the Container Toolkit, `--gpus all`, with graphics capability). Software Vulkan drivers are skipped, since the CPU renderer is faster; without a GPU, renders use the CPU.
