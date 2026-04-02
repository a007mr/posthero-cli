'use strict';

const chalk = require('chalk');
const { createClient, apiCall } = require('../api');
const { isJsonMode, printJson, printTable, printInfo } = require('../output');

async function status(options) {
  const client = createClient(options);

  // Fetch accounts + post counts in parallel
  const [accountsRes, publishedRes, scheduledRes, draftsRes] = await Promise.all([
    apiCall(() => client.get('/accounts')),
    apiCall(() => client.get('/posts', { params: { status: 'published', limit: 1 } })),
    apiCall(() => client.get('/posts', { params: { status: 'scheduled', limit: 1 } })),
    apiCall(() => client.get('/posts', { params: { status: 'draft',     limit: 1 } })),
  ]);

  const accounts  = accountsRes.data || [];
  const published = publishedRes.data?.pagination?.total ?? '—';
  const scheduled = scheduledRes.data?.pagination?.total ?? '—';
  const drafts    = draftsRes.data?.pagination?.total    ?? '—';

  if (isJsonMode(options)) {
    printJson({
      accounts: accounts.length,
      posts: { published, scheduled, drafts },
    });
    return;
  }

  console.log();
  console.log(chalk.bold('PostHero status'));
  console.log();

  // Accounts table
  if (accounts.length === 0) {
    printInfo('No connected accounts. Connect accounts at posthero.ai/app/settings/accounts');
  } else {
    // Group by platform
    const byPlatform = {};
    accounts.forEach(a => {
      byPlatform[a.platform] = (byPlatform[a.platform] || []);
      byPlatform[a.platform].push(a.name || a.username || a.id);
    });

    const accountRows = Object.entries(byPlatform).map(([platform, names]) => [
      chalk.grey(platform),
      names.join(', '),
    ]);

    console.log(chalk.bold(`  Connected accounts (${accounts.length})`));
    printTable([chalk.cyan('Platform'), chalk.cyan('Accounts')], accountRows);
  }

  // Posts summary
  console.log(chalk.bold(`\n  Posts`));
  printTable([chalk.cyan('Status'), chalk.cyan('Count')], [
    [chalk.green('published'), String(published)],
    [chalk.yellow('scheduled'), String(scheduled)],
    [chalk.grey('draft'),     String(drafts)],
  ]);
}

module.exports = { status };
