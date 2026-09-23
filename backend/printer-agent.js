require('dotenv').config();
const fs = require('fs');
const os = require('os');
const path = require('path');
const { printOrderFile } = require('./services/printService');

const apiBaseUrl = (process.env.PRINT_AGENT_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
const printerName = process.env.PRINTER_NAME;
const token = process.env.PRINT_AGENT_TOKEN;
const pollInterval = Number(process.env.PRINT_AGENT_POLL_MS || 5000);
const tempDir = path.join(os.tmpdir(), 'namaste-print-agent');

if (!printerName || !token) {
  throw new Error('Set PRINTER_NAME and PRINT_AGENT_TOKEN before starting the printer agent.');
}

const headers = { 'x-print-agent-token': token };

const poll = async () => {
  const response = await fetch(`${apiBaseUrl}/print-orders/agent/jobs?printerName=${encodeURIComponent(printerName)}`, { headers });
  if (!response.ok) throw new Error(`Job request failed (${response.status})`);
  const { job } = await response.json();
  if (!job) return;

  const fileResponse = await fetch(`${apiBaseUrl}/print-orders/agent/jobs/${encodeURIComponent(job._id)}/file`, { headers });
  if (!fileResponse.ok) throw new Error(`File request failed (${fileResponse.status})`);
  fs.mkdirSync(tempDir, { recursive: true });
  const filePath = path.join(tempDir, `${job._id}-${job.fileName || 'print-file'}`);
  fs.writeFileSync(filePath, Buffer.from(await fileResponse.arrayBuffer()));

  try {
    const result = await printOrderFile({ ...job, filePath });
    if (result.skipped) throw new Error('PRINT_COMMAND is not configured on the printer computer.');
    await fetch(`${apiBaseUrl}/print-orders/agent/jobs/${encodeURIComponent(job._id)}`, {
      method: 'PATCH',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ printStatus: 'printed' })
    });
    console.log(`Printed ${job.tokenId} on ${printerName}`);
  } catch (error) {
    await fetch(`${apiBaseUrl}/print-orders/agent/jobs/${encodeURIComponent(job._id)}`, {
      method: 'PATCH',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ printStatus: 'failed', printError: error.message })
    });
    console.error(`Print failed for ${job.tokenId}:`, error.message);
  } finally {
    fs.rmSync(filePath, { force: true });
  }
};

const run = async () => {
  try {
    await poll();
  } catch (error) {
    console.error('Printer agent:', error.message);
  } finally {
    setTimeout(run, pollInterval);
  }
};

console.log(`Printer agent listening for paid jobs on ${printerName}`);
run();
