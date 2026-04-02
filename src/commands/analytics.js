'use strict';

const chalk = require('chalk');
const { createClient, apiCall } = require('../api');
const { isJsonMode, printJson, printTable, printInfo, formatDate } = require('../output');

const PLATFORMS = ['twitter', 'threads', 'instagram', 'tiktok', 'youtube'];

function validatePlatform(platform) {
  if (!platform) {
    console.error(chalk.red('Error: --platform is required. Supported: ' + PLATFORMS.join(', ')));
    process.exit(1);
  }
  if (!PLATFORMS.includes(platform)) {
    console.error(chalk.red(`Error: unsupported platform "${platform}". Must be one of: ${PLATFORMS.join(', ')}`));
    process.exit(1);
  }
}

function truncate(str, len = 45) {
  if (!str) return chalk.grey('—');
  const clean = str.replace(/\n/g, ' ');
  return clean.length > len ? clean.slice(0, len) + '…' : clean;
}

function fmtNum(n) {
  if (n == null) return chalk.grey('—');
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k';
  return String(n);
}

function fmtRate(r) {
  if (r == null) return chalk.grey('—');
  return r.toFixed(2) + '%';
}

function fmtDelta(n) {
  if (n == null) return chalk.grey('—');
  if (n > 0) return chalk.green('+' + n);
  if (n < 0) return chalk.red(String(n));
  return chalk.grey('0');
}

// ─── summary ──────────────────────────────────────────────────────────────────

async function summary(options) {
  validatePlatform(options.platform);
  const client = createClient(options);

  const params = { platform: options.platform };
  if (options.account) params.accountId = options.account;
  if (options.start)   params.startDate = options.start;
  if (options.end)     params.endDate   = options.end;

  const result = await apiCall(() => client.get('/analytics/summary', { params }));

  if (isJsonMode(options)) {
    printJson(result.data);
    return;
  }

  const d = result.data;
  const rows = Object.entries(d)
    .filter(([k]) => k !== '_id')
    .map(([k, v]) => {
      const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
      const formatted = k.toLowerCase().includes('rate') ? fmtRate(v) : fmtNum(v);
      return [chalk.grey(label), formatted];
    });

  console.log();
  console.log(chalk.bold(`Analytics summary — ${options.platform}`));
  if (options.start || options.end) {
    console.log(chalk.grey(`Period: ${options.start || '…'} → ${options.end || 'now'}`));
  }
  console.log();
  printTable([chalk.cyan('Metric'), chalk.cyan('Value')], rows);
}

// ─── posts ────────────────────────────────────────────────────────────────────

async function posts(options) {
  validatePlatform(options.platform);
  const client = createClient(options);

  const params = { platform: options.platform };
  if (options.account)   params.accountId  = options.account;
  if (options.start)     params.startDate  = options.start;
  if (options.end)       params.endDate    = options.end;
  if (options.sortBy)    params.sortBy     = options.sortBy;
  if (options.sortOrder) params.sortOrder  = options.sortOrder;
  if (options.page)      params.page       = options.page;
  if (options.limit)     params.limit      = options.limit;

  const result = await apiCall(() => client.get('/analytics/posts', { params }));

  if (isJsonMode(options)) {
    printJson(result);
    return;
  }

  const { data, pagination } = result;

  if (!data?.length) {
    printInfo('No analytics data found. Open the analytics page in the dashboard to trigger an initial sync.');
    return;
  }

  const rows = data.map(p => [
    chalk.grey(p.id.slice(-8)),
    truncate(p.text),
    formatDate(p.createdAt),
    fmtNum(p.metrics?.impressions),
    fmtNum(p.metrics?.likes),
    fmtNum(p.metrics?.shares),
    fmtRate(p.metrics?.engagement_rate),
  ]);

  console.log();
  console.log(chalk.bold(`Posts analytics — ${options.platform}`));
  if (options.start || options.end) {
    console.log(chalk.grey(`Period: ${options.start || '…'} → ${options.end || 'now'}`));
  }
  console.log();
  printTable(
    [chalk.cyan('ID (…)'), chalk.cyan('Text'), chalk.cyan('Date'), chalk.cyan('Impr.'), chalk.cyan('Likes'), chalk.cyan('Shares'), chalk.cyan('Eng.%')],
    rows
  );

  if (pagination) {
    console.log(chalk.grey(`\n  Page ${pagination.page} of ${pagination.pages} — ${pagination.total} total posts`));
    if (pagination.page < pagination.pages) {
      console.log(chalk.grey(`  Use --page ${pagination.page + 1} for more`));
    }
  }
}

// ─── top ──────────────────────────────────────────────────────────────────────

async function top(options) {
  validatePlatform(options.platform);
  const client = createClient(options);

  const params = { platform: options.platform };
  if (options.account) params.accountId = options.account;
  if (options.metric)  params.metric    = options.metric;
  if (options.limit)   params.limit     = options.limit;
  if (options.start)   params.startDate = options.start;
  if (options.end)     params.endDate   = options.end;

  const result = await apiCall(() => client.get('/analytics/top', { params }));

  if (isJsonMode(options)) {
    printJson(result.data);
    return;
  }

  const { data } = result;

  if (!data?.length) {
    printInfo('No analytics data found. Open the analytics page in the dashboard to trigger an initial sync.');
    return;
  }

  const metric = options.metric || (options.platform === 'youtube' ? 'views' : 'impressions');

  const rows = data.map((p, i) => [
    chalk.bold(String(i + 1)),
    truncate(p.text),
    formatDate(p.createdAt),
    fmtNum(p.metrics?.[metric] ?? p.metrics?.impressions),
    fmtRate(p.metrics?.engagement_rate),
    p.permalink ? chalk.grey(truncate(p.permalink, 40)) : chalk.grey('—'),
  ]);

  console.log();
  console.log(chalk.bold(`Top performers — ${options.platform} by ${metric}`));
  if (options.start || options.end) {
    console.log(chalk.grey(`Period: ${options.start || '…'} → ${options.end || 'now'}`));
  }
  console.log();
  printTable(
    [chalk.cyan('#'), chalk.cyan('Text'), chalk.cyan('Date'), chalk.cyan(metric), chalk.cyan('Eng.%'), chalk.cyan('Link')],
    rows
  );
}

// ─── follower-growth ──────────────────────────────────────────────────────────

async function followerGrowth(options) {
  validatePlatform(options.platform);
  if (!options.account) {
    console.error(chalk.red('Error: --account <accountId> is required'));
    process.exit(1);
  }

  const client = createClient(options);

  const params = { platform: options.platform, accountId: options.account };
  if (options.start) params.startDate = options.start;
  if (options.end)   params.endDate   = options.end;

  const result = await apiCall(() => client.get('/analytics/follower-growth', { params }));

  if (isJsonMode(options)) {
    printJson(result.data);
    return;
  }

  const d = result.data;

  console.log();
  console.log(chalk.bold(`Follower growth — ${options.platform}`));
  console.log();
  printTable([chalk.cyan(''), chalk.cyan('Value')], [
    [chalk.grey('Followers at start'), d.start != null ? fmtNum(d.start) : chalk.grey('—')],
    [chalk.grey('Followers at end'),   fmtNum(d.end)],
    [chalk.grey('Change'),             fmtDelta(d.delta)],
    [chalk.grey('Period start'),       d.startTs ? formatDate(d.startTs) : chalk.grey('—')],
    [chalk.grey('Period end'),         d.endTs   ? formatDate(d.endTs)   : chalk.grey('—')],
  ]);

  if (d.start == null) {
    console.log(chalk.grey('\n  Note: only one snapshot exists — growth delta requires at least two syncs.'));
  }
}

module.exports = { summary, posts, top, followerGrowth };
