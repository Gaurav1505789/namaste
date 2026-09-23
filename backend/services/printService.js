const { execFile } = require('child_process');

const parseArguments = () => {
  if (!process.env.PRINT_COMMAND_ARGS) return [];

  try {
    const args = JSON.parse(process.env.PRINT_COMMAND_ARGS);
    if (!Array.isArray(args)) throw new Error('PRINT_COMMAND_ARGS must be a JSON array');
    return args;
  } catch (error) {
    throw new Error(`Invalid PRINT_COMMAND_ARGS: ${error.message}`);
  }
};

const replaceTokens = (value, order) => String(value)
  .replaceAll('{filePath}', order.filePath)
  .replaceAll('{printerName}', process.env.PRINTER_NAME || '')
  .replaceAll('{copies}', String(order.copies || 1));

const printOrderFile = (order) => new Promise((resolve, reject) => {
  if (!process.env.PRINT_COMMAND) {
    resolve({ skipped: true, reason: 'PRINT_COMMAND is not configured' });
    return;
  }

  const args = parseArguments().map(argument => replaceTokens(argument, order));
  execFile(process.env.PRINT_COMMAND, args, { timeout: 120000 }, error => {
    if (error) {
      reject(new Error(`Printer command failed: ${error.message}`));
      return;
    }
    resolve({ skipped: false });
  });
});

module.exports = { printOrderFile };