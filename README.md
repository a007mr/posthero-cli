# PostHero CLI

Create, schedule, and publish social media posts from the terminal. View analytics. Automate your content workflow from CI/CD pipelines, scripts, or just the command line.

## Installation

```bash
npm install -g @posthero/cli
```

## Authentication

Get your API key from [posthero.ai/app/settings/api](https://posthero.ai/app/settings/api), then:

```bash
posthero login
```

Or pass it inline with any command using `--key <your-api-key>`.

## Commands

### Accounts

```bash
posthero accounts list
```

Lists all your connected social media accounts with their IDs. You'll need account IDs when creating posts or filtering analytics.

### Posts

**List posts**
```bash
posthero posts list
posthero posts list --status draft
posthero posts list --platform linkedin
posthero posts list --limit 50 --page 2
```

**Get a post**
```bash
posthero posts get <id>
```

**Create a post (interactive)**
```bash
posthero posts create
```

**Create a post (flags)**
```bash
# Save as draft
posthero posts create \
  --text "Your post content here" \
  --platforms "linkedin:<accountId>"

# Multiple platforms
posthero posts create \
  --text "Your post content here" \
  --platforms "linkedin:<accountId>,twitter:<accountId>"

# Schedule for later
posthero posts create \
  --text "Your post content here" \
  --platforms "linkedin:<accountId>" \
  --schedule "2025-04-01T09:00:00Z"

# Publish immediately
posthero posts create \
  --text "Your post content here" \
  --platforms "linkedin:<accountId>" \
  --now

# Read content from a file
posthero posts create \
  --file post.txt \
  --platforms "linkedin:<accountId>"

# With an image
posthero posts create \
  --text "Your post content here" \
  --platforms "linkedin:<accountId>" \
  --image ./photo.jpg

# Platform-specific text
posthero posts create \
  --text "Default text" \
  --platforms "linkedin:<accountId>,twitter:<accountId>" \
  --linkedin-text "Longer version for LinkedIn" \
  --twitter-text "Short version for Twitter"
```

**Update a post**
```bash
posthero posts update <id> --text "Updated text"
posthero posts update <id> --schedule "2025-04-01T10:00:00Z"
```

**Delete a post**
```bash
posthero posts delete <id>
posthero posts delete <id> --force   # skip confirmation
```

**Publish a draft immediately**
```bash
posthero posts publish <id>
```

### Media

```bash
posthero media upload ./image.jpg
```

Uploads a file and returns the URL to use in posts.

### Analytics

Read engagement metrics for posts published across Twitter, Threads, Instagram, TikTok, and YouTube.

Supported platforms: `twitter` `threads` `instagram` `tiktok` `youtube`

**Summary — aggregated KPIs**
```bash
posthero analytics summary --platform threads
posthero analytics summary --platform instagram --start 2026-03-01 --end 2026-03-31
posthero analytics summary --platform twitter --account <accountId>
```

**Posts — paginated analytics**
```bash
posthero analytics posts --platform threads
posthero analytics posts --platform threads --sort-by likes --limit 20
posthero analytics posts --platform youtube --sort-by watchMinutes --page 2
```

**Top performers**
```bash
posthero analytics top --platform threads
posthero analytics top --platform twitter --metric impressions --limit 5
posthero analytics top --platform instagram --metric saves --start 2026-03-01
```

Available metrics per platform:

| Platform | Metrics |
|----------|---------|
| `twitter` | `impressions`, `likes`, `replies`, `retweets`, `bookmarks`, `url_clicks`, `engagement_rate` |
| `threads` | `impressions`, `likes`, `replies`, `reposts`, `quotes`, `engagement_rate` |
| `instagram` | `impressions`, `reach`, `likes`, `replies`, `saves`, `shares`, `engagement_rate` |
| `tiktok` | `impressions`, `likes`, `replies`, `shares`, `engagement_rate` |
| `youtube` | `views`, `likes`, `replies`, `shares`, `watchMinutes`, `subscribersGained`, `engagement_rate` |

**Follower growth**
```bash
posthero analytics follower-growth --platform threads --account <accountId>
posthero analytics follower-growth --platform twitter --account <accountId> --start 2026-03-01 --end 2026-03-31
```

Get your account IDs from `posthero accounts list`.

### Status

```bash
posthero status
```

Shows connected accounts grouped by platform and a post count summary (published / scheduled / drafts).

### Shell Completion

```bash
# zsh — add to ~/.zshrc for permanent use
source <(posthero completion zsh)

# bash — add to ~/.bashrc for permanent use
source <(posthero completion bash)

# fish
posthero completion fish > ~/.config/fish/completions/posthero.fish
```

After loading, press Tab to autocomplete commands and subcommands.

## Global Options

| Option | Description |
|--------|-------------|
| `--key <key>` | API key (overrides stored key) |
| `--json` | Output raw JSON (useful for scripting) |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `POSTHERO_API_KEY` | Your API key |
| `POSTHERO_BASE_URL` | API base URL (default: `https://server.posthero.ai/api/v1`) |
| `POSTHERO_DEBUG` | Set to `1` to print request/response details to stderr |

## Scripting

Use `--json` to get machine-readable output:

```bash
# Get all account IDs
posthero accounts list --json | jq '.[].id'

# Get top 10 posts as JSON
posthero analytics top --platform threads --limit 10 --json

# Get summary for last 30 days
posthero analytics summary --platform twitter --start 2026-03-01 --end 2026-03-31 --json

# Create a post from a script
posthero posts create \
  --text "$(cat post.txt)" \
  --platforms "linkedin:<accountId>" \
  --json
```

## CI/CD Example

```yaml
# .github/workflows/release.yml
- name: Announce release
  run: |
    posthero posts create \
      --text "Version ${{ github.ref_name }} is live!" \
      --platforms "linkedin:<accountId>,twitter:<accountId>" \
      --now
  env:
    POSTHERO_API_KEY: ${{ secrets.POSTHERO_API_KEY }}
```

## Requirements

- Node.js 18+
- A PostHero account with API access ([posthero.ai](https://posthero.ai))
