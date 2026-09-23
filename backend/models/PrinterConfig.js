const mongoose = require('mongoose');

const printerConfigSchema = new mongoose.Schema({
  key: {
    type: String,
    unique: true,
    default: 'default'
  },
  printers: {
    type: [String],
    default: []
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PrinterConfig', printerConfigSchema);