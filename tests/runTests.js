const path = require('path');
const { spawn } = require('child_process');

process.env.NODE_PATH = path.resolve(__dirname, '../server/node_modules');
require('module').Module._initPaths();

// Spawn node --test runner with all test files
const testFiles = [
  path.resolve(__dirname, 'authAndGstinFlow.test.js'),
  path.resolve(__dirname, 'farmerOrdersFlow.test.js'),
  path.resolve(__dirname, 'profileAndPaymentFlow.test.js'),
  path.resolve(__dirname, 'security/authAndRoleSecurity.test.js'),
  path.resolve(__dirname, 'security/noSqlAndInputSecurity.test.js'),
  path.resolve(__dirname, 'security/orderAndInventorySecurity.test.js'),
  path.resolve(__dirname, 'checkoutAndInvoiceFlow.test.js'),
  path.resolve(__dirname, 'emailTemplates.test.js'),
];

const child = spawn(process.execPath, ['--test', ...testFiles], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_PATH: path.resolve(__dirname, '../server/node_modules'),
  },
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
