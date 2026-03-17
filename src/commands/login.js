'use strict';

const inquirer = require('inquirer');
const ora = require('ora');
const chalk = require('chalk');
const { setApiKey, clearApiKey } = require('../config');
const { createClient, apiCall } = require('../api');
const { maskKey } = require('../output');

async function login(options) {
  let key = options.key;

  if (!key) {
    const { inputKey } = await inquirer.prompt([
      {
        type: 'password',
        name: 'inputKey',
        message: 'Paste your API key (from posthero.ai/app/settings/api):',
        validate: v => v.startsWith('pk_') ? true : 'Key must start with pk_',
      },
    ]);
    key = inputKey;
  }

  const spinner = ora('Validating API key...').start();

  try {
    const client = createClient({ key });
    const result = await apiCall(() => client.get('/accounts'));

    if (result.success) {
      setApiKey(key);
      spinner.succeed(`Logged in! Key saved: ${maskKey(key)}`);
      console.log(chalk.grey(`  Found ${result.data.length} connected account(s).`));
    } else {
      spinner.fail('Invalid API key.');
      process.exit(1);
    }
  } catch {
    spinner.fail('Could not validate key.');
    process.exit(1);
  }
}

function logout() {
  clearApiKey();
  console.log(chalk.green('✓') + ' Logged out. API key removed.');
}

async function whoami(options) {
  const { createClient, apiCall, resolveApiKey } = require('../api');
  const { maskKey } = require('../output');

  const key = resolveApiKey(options);
  if (!key) {
    console.error(chalk.red('Not logged in. Run: posthero login'));
    process.exit(1);
  }

  const spinner = ora('Fetching info...').start();
  const client = createClient(options);

  const result = await apiCall(() => client.get('/accounts'));
  spinner.stop();

  console.log('');
  console.log(`  API Key:  ${maskKey(key)}`);
  console.log(`  Accounts: ${result.data.length} connected`);
  console.log('');
}

module.exports = { login, logout, whoami };
