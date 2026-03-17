'use strict';

const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const ora = require('ora');
const chalk = require('chalk');
const { createClient, apiCall } = require('../api');
const { isJsonMode, printJson, printTable, printSuccess, formatDate } = require('../output');

// ── helpers ──────────────────────────────────────────────────────────────────

function statusColor(status) {
  switch (status) {
    case 'published': return chalk.green(status);
    case 'scheduled': return chalk.yellow(status);
    case 'draft':     return chalk.grey(status);
    case 'failed':    return chalk.red(status);
    default:          return status;
  }
}

// Build the POST /posts request body from CLI options + optionally a media URL
function buildPostBody(options, mediaUrl) {
  let text = options.text || '';

  if (options.file) {
    text = fs.readFileSync(path.resolve(options.file), 'utf-8').trim();
  }

  // Parse platforms string e.g. "linkedin,twitter" → array
  // Each entry needs platform + accountId.
  // User can pass: "linkedin:accountId123,twitter:accountId456"
  // or just "linkedin,twitter" (server resolves first matching account per platform)
  const parsedPlatforms = (options.platforms || '').split(',').filter(Boolean).map(p => {
    const [platform, accountId] = p.trim().split(':');
    return accountId ? { platform, accountId } : { platform };
  });

  // Per-platform text overrides
  const platformContent = {};
  if (options.linkedinText) platformContent.linkedin = { text: options.linkedinText };
  if (options.twitterText)  platformContent.twitter  = { text: options.twitterText };
  if (options.blueskyText)  platformContent.bluesky  = { text: options.blueskyText };
  if (options.threadsText)  platformContent.threads  = { text: options.threadsText };

  const body = {
    text,
    platforms: parsedPlatforms,
    publishNow: options.now || false,
    schedule: options.schedule || undefined,
    isThread: options.thread || false,
  };

  if (Object.keys(platformContent).length) body.platformContent = platformContent;

  if (mediaUrl) {
    body.media = { images: [mediaUrl] };
  } else if (options.video) {
    // video handled separately via upload first
  }

  return body;
}

// ── commands ─────────────────────────────────────────────────────────────────

async function list(options) {
  const client = createClient(options);

  const params = {};
  if (options.status)   params.status   = options.status;
  if (options.platform) params.platform = options.platform;
  if (options.page)     params.page     = options.page;
  if (options.limit)    params.limit    = options.limit;

  const result = await apiCall(() => client.get('/posts', { params }));

  if (isJsonMode(options)) {
    printJson(result.data);
    return;
  }

  const { posts, pagination } = result.data;

  if (!posts.length) {
    console.log(chalk.grey('No posts found.'));
    return;
  }

  printTable(
    ['ID', 'Status', 'Platforms', 'Scheduled At', 'Created At'],
    posts.map(p => [
      chalk.grey(p.id),
      statusColor(p.status),
      (p.platforms || []).map(x => x.platform).join(', ') || '—',
      formatDate(p.schedule),
      formatDate(p.createdAt),
    ])
  );

  if (pagination) {
    console.log(chalk.grey(`\n  Page ${pagination.page} of ${Math.ceil(pagination.total / pagination.limit)} — ${pagination.total} total posts`));
  }
}

async function get(id, options) {
  const client = createClient(options);
  const result = await apiCall(() => client.get(`/posts/${id}`));

  if (isJsonMode(options)) {
    printJson(result.data);
    return;
  }

  const p = result.data;
  console.log('');
  console.log(`  ID:        ${chalk.grey(p.id)}`);
  console.log(`  Status:    ${statusColor(p.status)}`);
  console.log(`  Text:      ${p.text?.slice(0, 120)}${p.text?.length > 120 ? '…' : ''}`);
  console.log(`  Platforms: ${(p.platforms || []).map(x => x.platform).join(', ') || '—'}`);
  console.log(`  Scheduled: ${formatDate(p.schedule)}`);
  console.log(`  Created:   ${formatDate(p.createdAt)}`);

  if (p.platforms?.length) {
    console.log('');
    p.platforms.forEach(x => {
      const url = x.postUrl ? chalk.cyan(x.postUrl) : '—';
      console.log(`  [${x.platform}] ${statusColor(x.status)}  ${url}`);
    });
  }
  console.log('');
}

async function create(options) {
  let finalOptions = { ...options };

  // Interactive mode when no text and no file
  if (!options.text && !options.file && !options.interactive) {
    const client = createClient(options);
    const accountsResult = await apiCall(() => client.get('/accounts'));
    const accountChoices = accountsResult.data.map(a => ({
      name: `${a.platform} — ${a.name || a.username || a.id}`,
      value: `${a.platform}:${a.id}`,
    }));

    const answers = await inquirer.prompt([
      {
        type: 'editor',
        name: 'text',
        message: 'Post content:',
      },
      {
        type: 'checkbox',
        name: 'platformsList',
        message: 'Publish to:',
        choices: accountChoices,
        validate: v => v.length ? true : 'Select at least one platform',
      },
      {
        type: 'list',
        name: 'action',
        message: 'What to do:',
        choices: [
          { name: 'Save as draft', value: 'draft' },
          { name: 'Publish now', value: 'now' },
          { name: 'Schedule for later', value: 'schedule' },
        ],
      },
      {
        type: 'input',
        name: 'schedule',
        message: 'Schedule time (ISO 8601, e.g. 2025-04-01T09:00:00Z):',
        when: a => a.action === 'schedule',
      },
    ]);

    finalOptions.text = answers.text.trim();
    finalOptions.platforms = answers.platformsList.join(',');
    finalOptions.now = answers.action === 'now';
    finalOptions.schedule = answers.schedule || undefined;
  }

  // Upload image first if --image flag provided
  let mediaUrl;
  if (finalOptions.image) {
    const { upload } = require('./media');
    mediaUrl = await upload(finalOptions.image, finalOptions);
  }

  const body = buildPostBody(finalOptions, mediaUrl);

  if (!body.text && !body.platformContent) {
    console.error(chalk.red('Post text is required (--text or --file)'));
    process.exit(1);
  }

  if (!body.platforms.length) {
    console.error(chalk.red('At least one platform is required (--platforms linkedin,twitter)'));
    process.exit(1);
  }

  const spinner = ora('Creating post...').start();
  const client = createClient(finalOptions);
  const result = await apiCall(() => client.post('/posts', body));
  spinner.stop();

  if (isJsonMode(options)) {
    printJson(result.data);
    return;
  }

  printSuccess(`Post ${result.data.status}: ${chalk.grey(result.data.id)}`);
  if (result.data.schedule) {
    console.log(chalk.grey(`  Scheduled for: ${formatDate(result.data.schedule)}`));
  }
}

async function update(id, options) {
  const body = {};
  if (options.text)     body.text     = options.text;
  if (options.schedule) body.schedule = options.schedule;
  if (options.platforms) {
    body.platforms = options.platforms.split(',').filter(Boolean).map(p => {
      const [platform, accountId] = p.trim().split(':');
      return accountId ? { platform, accountId } : { platform };
    });
  }

  const spinner = ora('Updating post...').start();
  const client = createClient(options);
  const result = await apiCall(() => client.patch(`/posts/${id}`, body));
  spinner.stop();

  if (isJsonMode(options)) {
    printJson(result.data);
    return;
  }

  printSuccess(`Post updated: ${chalk.grey(id)}`);
}

async function del(id, options) {
  if (!options.force) {
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Delete post ${id}?`,
        default: false,
      },
    ]);
    if (!confirm) {
      console.log(chalk.grey('Cancelled.'));
      return;
    }
  }

  const spinner = ora('Deleting...').start();
  const client = createClient(options);
  await apiCall(() => client.delete(`/posts/${id}`));
  spinner.stop();

  printSuccess(`Post deleted: ${chalk.grey(id)}`);
}

async function publish(id, options) {
  const spinner = ora('Publishing...').start();
  const client = createClient(options);
  const result = await apiCall(() => client.post(`/posts/${id}/publish`));
  spinner.stop();

  if (isJsonMode(options)) {
    printJson(result.data);
    return;
  }

  printSuccess(`Published: ${chalk.grey(id)}`);
  (result.data.results || []).forEach(r => {
    const url = r.postUrl ? chalk.cyan(r.postUrl) : '';
    console.log(`  [${r.platform}] ${statusColor(r.status)}  ${url}`);
  });
}

module.exports = { list, get, create, update, delete: del, publish };
