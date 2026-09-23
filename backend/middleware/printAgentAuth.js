module.exports = function printAgentAuth(req, res, next) {
  const token = req.headers['x-print-agent-token'];
  if (!process.env.PRINT_AGENT_TOKEN || token !== process.env.PRINT_AGENT_TOKEN) {
    return res.status(401).json({ message: 'Print agent authentication required' });
  }
  return next();
};