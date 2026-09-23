const fs = require('fs');
const path = require('path');

const [, , sourcePath, printerName, copies = '1'] = process.argv;
if (!sourcePath || !printerName) throw new Error('Usage: node mock-printer.js <filePath> <printerName> <copies>');

const outputDir = path.join(__dirname, 'mock-printed-output');
fs.mkdirSync(outputDir, { recursive: true });
const outputPath = path.join(outputDir, `${Date.now()}-${path.basename(sourcePath)}.printed.txt`);
fs.copyFileSync(sourcePath, outputPath);
console.log(`MOCK PRINT OK: ${printerName}; copies=${copies}; output=${outputPath}`);
