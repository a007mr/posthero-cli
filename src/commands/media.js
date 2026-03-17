'use strict';

const fs = require('fs');
const path = require('path');
const ora = require('ora');
const FormData = require('form-data');
const { createClient, resolveApiKey, apiCall } = require('../api');
const { getConfig } = require('../config');
const { isJsonMode, printJson, printSuccess } = require('../output');

// Returns the S3 URL — used internally by posts.js too
async function upload(filePath, options = {}) {
  const resolved = path.resolve(filePath);

  if (!fs.existsSync(resolved)) {
    const chalk = require('chalk');
    console.error(chalk.red(`File not found: ${resolved}`));
    process.exit(1);
  }

  const key = resolveApiKey(options);
  const { baseUrl } = getConfig();

  const form = new FormData();
  form.append('file', fs.createReadStream(resolved));

  const spinner = ora(`Uploading ${path.basename(resolved)}...`).start();

  try {
    const axios = require('axios');
    const res = await axios.post(`${baseUrl}/media/upload`, form, {
      headers: {
        Authorization: `Bearer ${key}`,
        ...form.getHeaders(),
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    spinner.stop();
    return res.data?.data?.url;
  } catch (err) {
    spinner.fail('Upload failed.');
    const chalk = require('chalk');
    const msg = err.response?.data?.error || err.message;
    console.error(chalk.red(msg));
    process.exit(1);
  }
}

async function uploadCommand(filePath, options) {
  const url = await upload(filePath, options);

  if (isJsonMode(options)) {
    printJson({ url });
    return;
  }

  printSuccess(`Uploaded: ${url}`);
}

module.exports = { upload, uploadCommand };
