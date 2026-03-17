'use strict';

const chalk = require('chalk');
const Table = require('cli-table3');

function isJsonMode(options = {}) {
  return options.json === true;
}

function printJson(data) {
  console.log(JSON.stringify(data, null, 2));
}

function printTable(head, rows) {
  const table = new Table({
    head: head.map(h => chalk.cyan(h)),
    style: { border: ['grey'] },
  });
  rows.forEach(r => table.push(r));
  console.log(table.toString());
}

function printSuccess(msg) {
  console.log(chalk.green('✓') + ' ' + msg);
}

function printInfo(msg) {
  console.log(chalk.grey(msg));
}

function maskKey(key) {
  if (!key || key.length < 12) return key;
  return key.slice(0, 10) + '●'.repeat(8);
}

function formatDate(dateStr) {
  if (!dateStr) return chalk.grey('—');
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

module.exports = { isJsonMode, printJson, printTable, printSuccess, printInfo, maskKey, formatDate };
