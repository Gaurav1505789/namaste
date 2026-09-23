const mongoose = require('mongoose');

const printOrderSchema = new mongoose.Schema({
  tokenId: {
    type: String,
    required: true,
    unique: true
  },
  studentName: {
    type: String,
    required: true
  },
  mobile: {
    type: String,
    required: true
  },
  rollNumber: String,
  department: String,
  colorMode: {
    type: String,
    enum: ['bw', 'color'],
    default: 'bw'
  },
  sides: {
    type: String,
    enum: ['single', 'double'],
    default: 'single'
  },
  orientation: {
    type: String,
    enum: ['auto', 'portrait', 'landscape'],
    default: 'auto'
  },
  copies: {
    type: Number,
    default: 1
  },
  totalPages: {
    type: Number,
    default: 1
  },
  pageRange: {
    type: String,
    default: 'All Pages'
  },
  specialInstructions: String,
  fileName: String,
  filePath: String,
  fileType: String,
  fileSize: Number,
  paymentProofFileName: String,
  paymentProofPath: String,
  paymentProofFileType: String,
  paymentProofFileSize: Number,
  totalAmount: {
    type: Number,
    default: 0
  },
  paymentMethod: {
    type: String,
    enum: ['upi', 'razorpay', 'cod'],
    default: 'upi'
  },
  upiTransactionId: String,
  razorpayOrderId: String,
  razorpayPaymentId: String,
  printerName: String,
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'rejected'],
    default: 'pending'
  },
  paymentVerifiedAt: Date,
  status: {
    type: String,
    enum: ['queued', 'printing', 'late_printing', 'ready_for_pickup', 'collected'],
    default: 'queued'
  },
  printStatus: {
    type: String,
    enum: ['not_queued', 'queued', 'printing', 'printed', 'failed', 'skipped'],
    default: 'not_queued'
  },
  printError: String,
  printQueuedAt: Date,
  printedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PrintOrder', printOrderSchema);
