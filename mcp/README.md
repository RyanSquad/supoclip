# GungleClips MCP Server

A [Model Context Protocol](https://modelcontextprotocol.io) server for
[GungleClips](https://clips.gungle.ai) — turn long-form videos (YouTube links or
direct URLs) into short, vertical, subtitled viral clips from any MCP client
(Claude Desktop, Claude Code, Cursor, etc.).

By default it talks to the **official hosted GungleClips API** at
`https://api.clips.gungle.ai`. Point it at your own deployment by setting
`GUNGLECLIPS_API_URL`.

## What it can do

| Tool | Auth | Description |
|------|:----:|-------------|
| `gungleclips_health` | – | API status + how this server is configured |
| `gungleclips_list_caption_templates` | – | Available caption styles (default, hormozi, mrbeast, …) |
| `gungleclips_list_transitions` | – | Available transition effects |
| `gungleclips_broll_status` | – | Whether B-roll overlays are configured |
| `gungleclips_list_fonts` | ✓ | Subtitle fonts available to your account |
| `gungleclips_billing_summary` | ✓ | Plan, usage and remaining quota |
| `gungleclips_create_clip_task` | ✓ | Start clipping a video → returns a `task_id` |
| `gungleclips_list_tasks` | ✓ | List your tasks |
| `gungleclips_get_task` | ✓ | Task status, progress and clips |
| `gungleclips_wait_for_task` | ✓ | Poll until a task finishes |
| `gungleclips_list_clips` | ✓ | List a task's generated clips |
| `gungleclips_download_clip` | ✓ | Save a clip's MP4 to disk |
| `gungleclips_export_clip` | ✓ | Re-encode + save with a platform preset (tiktok/reels/shorts) |
| `gungleclips_cancel_task` / `gungleclips_resume_task` / `gungleclips_delete_task` | ✓ | Manage tasks |

Tools marked ✓ require an API key (or self-host credentials, see below).

## Getting an API key

1. Sign in at [clips.gungle.ai](https://clips.gungle.ai).
2. Go to **Settings → API Keys**.
3. Create a key and copy it (it's shown only once). It looks like `sk_…`.

## Configuration

All configuration is via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `GUNGLECLIPS_API_KEY` | – | Your API key (recommended auth). |
| `GUNGLECLIPS_API_URL` | `https://api.clips.gungle.ai` | Backend base URL. Set for self-hosting. |
| `GUNGLECLIPS_DOWNLOAD_DIR` | `./gungleclips-downloads` | Where downloaded/exported clips are written. |
| `GUNGLECLIPS_TIMEOUT` | `60` | HTTP timeout (seconds) for non-download requests. |
| `GUNGLECLIPS_USER_ID` | – | Self-host only: authenticate by user id (see below). |
| `GUNGLECLIPS_AUTH_SECRET` | – | Self-host only: backend `BACKEND_AUTH_SECRET` for HMAC signing. |

### Self-hosting auth

If you run your own backend you have three options:

- **API key** (same as hosted): create a key and set `GUNGLECLIPS_API_KEY`.
- **Signed headers**: set `GUNGLECLIPS_USER_ID` + `GUNGLECLIPS_AUTH_SECRET` (your
  backend's `BACKEND_AUTH_SECRET`).
- **Unsigned**: if the backend runs with `ALLOW_UNSIGNED_BACKEND_AUTH=true`,
  just set `GUNGLECLIPS_USER_ID`.

Auth precedence is: API key → signed headers → unsigned user id.

## Install & run

Requires Python 3.10+. With [uv](https://docs.astral.sh/uv/):

```bash
cd mcp
uv run gungleclips-mcp        # runs the stdio server
```

Or install into the current environment:

```bash
pip install -e .
gungleclips-mcp
```

## Hosted SSE server

For clients that add a remote MCP URL, run the server over SSE and require a
GungleClips API key as the client Bearer token:

```bash
GUNGLECLIPS_API_URL=https://api.clips.gungle.ai \
GUNGLECLIPS_MCP_TRANSPORT=sse \
GUNGLECLIPS_MCP_HOST=0.0.0.0 \
GUNGLECLIPS_MCP_PORT=9100 \
GUNGLECLIPS_MCP_PUBLIC_URL=https://mcp.clips.gungle.ai \
GUNGLECLIPS_MCP_REQUIRE_BEARER_AUTH=true \
gungleclips-mcp
```

Then configure the MCP client with:

```text
Server URL: https://mcp.clips.gungle.ai/sse
Transport: SSE
Authentication: Bearer Token
Token: sk_your_gungleclips_api_key
```

With Docker Compose, the `mcp` service runs this mode by default and binds to
`127.0.0.1:9100` for a reverse proxy.

## Use with Claude Desktop / Claude Code

Add to your MCP client config (e.g. `claude_desktop_config.json`, or via
`claude mcp add`). Example using `uv` to run from a checkout:

```json
{
  "mcpServers": {
    "gungleclips": {
      "command": "uv",
      "args": ["--directory", "/absolute/path/to/supoclip/mcp", "run", "gungleclips-mcp"],
      "env": {
        "GUNGLECLIPS_API_KEY": "sk_your_key_here"
      }
    }
  }
}
```

For a self-hosted backend, add `"GUNGLECLIPS_API_URL": "http://localhost:8000"` to `env`.

With Claude Code:

```bash
claude mcp add supoclip -e GUNGLECLIPS_API_KEY=sk_your_key_here \
  -- uv --directory /absolute/path/to/supoclip/mcp run gungleclips-mcp
```

## Example prompts

- "Use supoclip to make clips from https://youtu.be/… with the hormozi caption template, then wait for it and download the top clip."
- "List my recent supoclip tasks and show the virality scores of the latest one's clips."
- "Export clip <id> from task <id> as a TikTok preset."

## License

AGPL-3.0-or-later, matching the GungleClips project.

### Clip length

`gungleclips_create_clip_task` accepts `clip_length`: `auto` (default, 15–60s),
`short` (15–30s), `medium` (30–60s), or `long` (1–2 min). This controls the
selection range and rendering limit. Removing pauses and filler words can
shorten the finished clips.
