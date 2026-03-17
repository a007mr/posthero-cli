'use strict';

const axios = require('axios');
const { getConfig } = require('./config');

function resolveApiKey(cmdOptions = {}) {
  return cmdOptions.key || process.env.POSTHERO_API_KEY || getConfig().apiKey;
}

function createClient(cmdOptions = {}) {
  const key = resolveApiKey(cmdOptions);

  if (!key) {
    const chalk = require('chalk');
    console.error(chalk.red('No API key found. Run: posthero login'));
    process.exit(1);
  }

  const { baseUrl } = getConfig();

  return axios.create({
    baseURL: baseUrl,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
  });
}

async function apiCall(fn) {
  try {
    const res = await fn();
    return res.data;
  } catch (err) {
    const data = err.response?.data;
    const msg = data?.error || err.message;
    const code = data?.code || 'UNKNOWN';
    const chalk = require('chalk');
    console.error(chalk.red(`Error [${code}]: ${msg}`));
    process.exit(1);
  }
}

module.exports = { createClient, apiCall, resolveApiKey };
