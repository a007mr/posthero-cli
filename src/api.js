'use strict';

const axios = require('axios');
const chalk = require('chalk');
const { getConfig } = require('./config');

const DEBUG = !!process.env.POSTHERO_DEBUG;

function resolveApiKey(cmdOptions = {}) {
  return cmdOptions.key || process.env.POSTHERO_API_KEY || getConfig().apiKey;
}

function createClient(cmdOptions = {}) {
  const key = resolveApiKey(cmdOptions);

  if (!key) {
    console.error(chalk.red('No API key found. Run: posthero login'));
    process.exit(1);
  }

  const { baseUrl } = getConfig();

  const client = axios.create({
    baseURL: baseUrl,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
  });

  if (DEBUG) {
    client.interceptors.request.use(config => {
      config._startTime = Date.now();
      const params = config.params ? '?' + new URLSearchParams(config.params).toString() : '';
      process.stderr.write(chalk.grey(`→ ${config.method.toUpperCase()} ${config.baseURL}${config.url}${params}\n`));
      return config;
    });

    client.interceptors.response.use(
      res => {
        const ms = Date.now() - res.config._startTime;
        process.stderr.write(chalk.grey(`← ${res.status} ${res.statusText} (${ms}ms)\n`));
        return res;
      },
      err => {
        const ms = err.config ? Date.now() - err.config._startTime : '?';
        const status = err.response?.status ?? 'ERR';
        process.stderr.write(chalk.red(`← ${status} (${ms}ms)\n`));
        if (err.response?.data) {
          process.stderr.write(chalk.red(JSON.stringify(err.response.data, null, 2) + '\n'));
        }
        return Promise.reject(err);
      }
    );
  }

  return client;
}

async function apiCall(fn) {
  try {
    const res = await fn();
    return res.data;
  } catch (err) {
    const data = err.response?.data;
    const msg = data?.error || err.message;
    const code = data?.code || 'UNKNOWN';
    console.error(chalk.red(`Error [${code}]: ${msg}`));
    process.exit(1);
  }
}

module.exports = { createClient, apiCall, resolveApiKey };
