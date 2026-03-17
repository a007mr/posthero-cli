'use strict';

const chalk = require('chalk');
const { createClient, apiCall } = require('../api');
const { isJsonMode, printJson, printTable } = require('../output');

async function list(options) {
  const client = createClient(options);
  const result = await apiCall(() => client.get('/accounts'));

  if (isJsonMode(options)) {
    printJson(result.data);
    return;
  }

  if (!result.data.length) {
    console.log(chalk.grey('No connected accounts found.'));
    return;
  }

  printTable(
    ['ID', 'Platform', 'Name', 'Username', 'Type'],
    result.data.map(a => [
      chalk.grey(String(a.id)),
      chalk.bold(a.platform),
      a.name || '—',
      a.username ? '@' + a.username : '—',
      a.type || '—',
    ])
  );
}

module.exports = { list };
