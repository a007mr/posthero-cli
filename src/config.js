'use strict';

const Conf = require('conf');

const store = new Conf({
  projectName: 'posthero',
  schema: {
    apiKey: { type: 'string' },
    baseUrl: { type: 'string' },
  },
});

function getConfig() {
  return {
    apiKey: store.get('apiKey'),
    baseUrl: process.env.POSTHERO_BASE_URL || store.get('baseUrl') || 'https://server.posthero.ai/api/v1',
  };
}

function setApiKey(key) {
  store.set('apiKey', key);
}

function clearApiKey() {
  store.delete('apiKey');
}

module.exports = { getConfig, setApiKey, clearApiKey };
