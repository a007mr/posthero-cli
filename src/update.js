'use strict';

/**
 * Non-blocking update check.
 * Hits the npm registry once per day. If a newer version exists, prints
 * a one-line notice before the command output. Silently skips on timeout/error.
 */

const axios = require('axios');
const chalk = require('chalk');
const Conf  = require('conf');
const pkg   = require('../package.json');

const store = new Conf({ projectName: 'posthero' });
const ONE_DAY = 24 * 60 * 60 * 1000;

async function checkForUpdate() {
  try {
    const lastCheck = store.get('lastUpdateCheck');
    if (lastCheck && Date.now() - lastCheck < ONE_DAY) return;

    const res = await axios.get(
      `https://registry.npmjs.org/${pkg.name}/latest`,
      { timeout: 2000 }
    );

    store.set('lastUpdateCheck', Date.now());

    const latest = res.data?.version;
    if (latest && latest !== pkg.version) {
      console.log(
        chalk.yellow(`\n  Update available`) +
        chalk.grey(` ${pkg.version} → `) +
        chalk.green(latest)
      );
      console.log(chalk.grey(`  npm install -g ${pkg.name}\n`));
    }
  } catch {
    // registry unreachable or timed out — skip silently
  }
}

module.exports = { checkForUpdate };
