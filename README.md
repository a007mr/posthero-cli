# PostHero CLI

Create, schedule, and publish social media posts from the terminal.

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

Lists all your connected social media accounts with their IDs. You'll need account IDs when creating posts.

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

## Scripting

Use `--json` to get machine-readable output:

```bash
# Get all account IDs
posthero accounts list --json | jq '.[].id'

# Create a post from a script
posthero posts create \
  --text "$(cat post.txt)" \
  --platforms "linkedin:<accountId>" \
  --json
```

## Requirements

- Node.js 18+
- A PostHero account with API access ([posthero.ai](https://posthero.ai))
