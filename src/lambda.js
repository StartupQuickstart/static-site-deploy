const App = require('./app').default;
const path = require('path');
const StaticFileHandler = require('serverless-aws-static-file-handler');
const serverless = require('serverless-http');

let app;
module.exports.universal = async function (event, context) {
  context.callbackWaitsForEmptyEventLoop = false;

  if (!app) {
    app = await App();
  }

  /** Immediate response for WarmUP plugin */
  if (event.source === 'serverless-plugin-warmup') {
    console.log('WarmUP - Lambda is warm!');
    return 'Lambda is warm!';
  }

  const binaryMimeTypes = [
    'application/javascript',
    'application/json',
    'application/octet-stream',
    'application/xml',
    'font/eot',
    'font/opentype',
    'font/otf',
    'image/jpeg',
    'image/png',
    'image/svg+xml',
    'text/comma-separated-values',
    'text/css',
    'text/html',
    'text/javascript',
    'text/plain',
    'text/text',
    'text/xml',
  ];

  return serverless(app, { binary: binaryMimeTypes })(event, context);
};
