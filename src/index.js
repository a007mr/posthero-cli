'use strict';

const { Command } = require('commander');
const pkg = require('../package.json');

const loginCmd      = require('./commands/login');
const accountsCmd   = require('./commands/accounts');
const postsCmd      = require('./commands/posts');
const mediaCmd      = require('./commands/media');
const analyticsCmd  = require('./commands/analytics');

const program = new Command();

program
  .name('posthero')
  .description('PostHero CLI — create, schedule, and publish social media posts from the terminal')
  .version(pkg.version);

// Global options available on all commands
const globalOptions = cmd => cmd
  .option('--key <key>', 'API key (overrides stored key and POSTHERO_API_KEY env var)')
  .option('--json', 'Output raw JSON (for scripting)');

// ── auth ─────────────────────────────────────────────────────────────────────

program
  .command('login')
  .description('Save your API key locally')
  .option('--key <key>', 'API key to save (non-interactive)')
  .option('--json', 'Output raw JSON (for scripting)')
  .action(opts => loginCmd.login(opts));

program
  .command('logout')
  .description('Remove stored API key')
  .action(() => loginCmd.logout());

globalOptions(
  program
    .command('whoami')
    .description('Show current API key and account info')
).action(opts => loginCmd.whoami(opts));

// ── accounts ─────────────────────────────────────────────────────────────────

const accounts = program.command('accounts').description('Manage connected social media accounts');

globalOptions(
  accounts
    .command('list')
    .description('List all connected accounts')
).action(opts => accountsCmd.list(opts));

// ── posts ─────────────────────────────────────────────────────────────────────

const posts = program.command('posts').description('Create and manage posts');

globalOptions(
  posts
    .command('list')
    .description('List posts')
    .option('--status <status>', 'Filter by status: draft | scheduled | published | failed')
    .option('--platform <platform>', 'Filter by platform')
    .option('--page <n>', 'Page number', '1')
    .option('--limit <n>', 'Posts per page', '20')
).action(opts => postsCmd.list(opts));

globalOptions(
  posts
    .command('get <id>')
    .description('Get a single post by ID')
).action((id, opts) => postsCmd.get(id, opts));

globalOptions(
  posts
    .command('create')
    .description('Create a post (interactive if no flags given)')
    .option('--text <text>', 'Post text')
    .option('--file <path>', 'Read post text from a file (markdown or plain text)')
    .option('--platforms <list>', 'Comma-separated platforms, e.g. linkedin:id123,twitter:id456')
    .option('--schedule <iso>', 'Schedule time in ISO 8601 UTC, e.g. 2025-04-01T09:00:00Z')
    .option('--now', 'Publish immediately')
    .option('--thread', 'Thread mode (split text on double line breaks)')
    .option('--image <path>', 'Image file to attach')
    .option('--linkedin-text <text>', 'LinkedIn-specific text override')
    .option('--twitter-text <text>', 'Twitter-specific text override')
    .option('--bluesky-text <text>', 'Bluesky-specific text override')
    .option('--threads-text <text>', 'Threads-specific text override')
).action(opts => postsCmd.create(opts));

globalOptions(
  posts
    .command('update <id>')
    .description('Update a draft or scheduled post')
    .option('--text <text>', 'New text')
    .option('--schedule <iso>', 'New schedule time')
    .option('--platforms <list>', 'New platforms list')
).action((id, opts) => postsCmd.update(id, opts));

globalOptions(
  posts
    .command('delete <id>')
    .description('Delete a post')
    .option('--force', 'Skip confirmation prompt')
).action((id, opts) => postsCmd.delete(id, opts));

globalOptions(
  posts
    .command('publish <id>')
    .description('Publish a draft or scheduled post immediately')
).action((id, opts) => postsCmd.publish(id, opts));

// ── media ─────────────────────────────────────────────────────────────────────

const media = program.command('media').description('Upload media files');

globalOptions(
  media
    .command('upload <file>')
    .description('Upload an image, video, or PDF and get back an S3 URL')
).action((file, opts) => mediaCmd.uploadCommand(file, opts));

// ── analytics ─────────────────────────────────────────────────────────────────

const analytics = program.command('analytics').description('View post analytics and follower growth');

globalOptions(
  analytics
    .command('summary')
    .description('Aggregated KPIs for a platform (impressions, likes, engagement rate, etc.)')
    .option('--platform <platform>', 'Platform: twitter | threads | instagram | tiktok | youtube')
    .option('--account <id>', 'Filter to a specific account ID')
    .option('--start <date>', 'Start date (ISO 8601, e.g. 2026-03-01)')
    .option('--end <date>', 'End date (ISO 8601, e.g. 2026-03-31)')
).action(opts => analyticsCmd.summary(opts));

globalOptions(
  analytics
    .command('posts')
    .description('Paginated post analytics sorted by any metric')
    .option('--platform <platform>', 'Platform: twitter | threads | instagram | tiktok | youtube')
    .option('--account <id>', 'Filter to a specific account ID')
    .option('--start <date>', 'Start date (ISO 8601)')
    .option('--end <date>', 'End date (ISO 8601)')
    .option('--sort-by <metric>', 'Metric to sort by (e.g. impressions, likes, engagement_rate)')
    .option('--sort-order <order>', 'desc (default) or asc')
    .option('--page <n>', 'Page number', '1')
    .option('--limit <n>', 'Posts per page (max 100)', '20')
).action(opts => analyticsCmd.posts(opts));

globalOptions(
  analytics
    .command('top')
    .description('Top N posts by a given metric')
    .option('--platform <platform>', 'Platform: twitter | threads | instagram | tiktok | youtube')
    .option('--metric <metric>', 'Metric to rank by (e.g. impressions, likes, engagement_rate, saves)')
    .option('--limit <n>', 'Number of posts (max 50)', '10')
    .option('--account <id>', 'Filter to a specific account ID')
    .option('--start <date>', 'Start date (ISO 8601)')
    .option('--end <date>', 'End date (ISO 8601)')
).action(opts => analyticsCmd.top(opts));

globalOptions(
  analytics
    .command('follower-growth')
    .description('Follower count and growth delta for an account')
    .option('--platform <platform>', 'Platform: twitter | threads | instagram | tiktok | youtube')
    .option('--account <id>', 'Account ID (required)')
    .option('--start <date>', 'Start date (ISO 8601)')
    .option('--end <date>', 'End date (ISO 8601)')
).action(opts => analyticsCmd.followerGrowth(opts));

// ── parse ─────────────────────────────────────────────────────────────────────

program.parse(process.argv);
