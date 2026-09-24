const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const mongoose = require('mongoose');
const router = express.Router();
const PrintOrder = require('../models/PrintOrder');
const PrinterConfig = require('../models/PrinterConfig');
const adminAuth = require('../middleware/adminAuth');
const printAgentAuth = require('../middleware/printAgentAuth');

const uploadDir = path.join(__dirname, '..', 'uploads', 'prints');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
const maxSize = 25 * 1024 * 1024;
let inMemoryPrintOrders = [];
let inMemoryPrinters = [];

const useDatabase = () => mongoose.connection.readyState === 1;

const queuePaidOrder = async (order) => {
  if (!order || order.paymentMethod === 'cod' || order.paymentStatus !== 'paid' || ['queued', 'printing', 'printed', 'skipped'].includes(order.printStatus)) {
    return order;
  }

  const queuedAt = new Date();
  if (useDatabase()) {
    order = await PrintOrder.findByIdAndUpdate(
      order._id,
      { printStatus: 'queued', printQueuedAt: queuedAt, printError: '', updatedAt: queuedAt },
      { new: true }
    );
  } else {
    order.printStatus = 'queued';
    order.printQueuedAt = queuedAt.toISOString();
    order.printError = '';
  }

  return order;
};

const configuredPrinters = () => {
  try {
    const printers = JSON.parse(process.env.PRINT_PRINTERS || '[]');
    if (Array.isArray(printers) && printers.filter(Boolean).length) return printers.filter(Boolean);
    return ['c1 printer', 'c2 printer'];
  } catch (error) {
    return ['c1 printer', 'c2 printer'];
  }
};

const getPrinterNames = async () => {
  if (!useDatabase()) return inMemoryPrinters.length ? inMemoryPrinters : configuredPrinters();
  const config = await PrinterConfig.findOne({ key: 'default' }).lean();
  return config?.printers?.length ? config.printers : configuredPrinters();
};

const normalizeOrder = (order) => ({
  ...order,
  _id: order._id || order.id || `${Date.now()}-${Math.random()}`,
  createdAt: order.createdAt || new Date().toISOString()
});

router.get('/', adminAuth, async (req, res) => {
  try {
    if (!useDatabase()) {
      return res.json([...inMemoryPrintOrders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    }

    const orders = await PrintOrder.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/upload', async (req, res) => {
  try {
    const uploadField = req.files?.file ? 'file' : (req.files?.paymentProof ? 'paymentProof' : null);
    if (!uploadField) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const file = req.files[uploadField];
    const mime = file.mimetype || '';
    const extension = path.extname(file.name || '').toLowerCase();

    const isAllowed = uploadField === 'paymentProof'
      ? ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(mime) || ['.jpg', '.jpeg', '.png', '.webp'].includes(extension)
      : allowedTypes.includes(mime) || ['.pdf', '.jpg', '.jpeg', '.png', '.webp'].includes(extension);
    if (!isAllowed) {
      return res.status(400).json({ message: uploadField === 'paymentProof' ? 'Payment proof must be a JPG, PNG, or WEBP image.' : 'Unsupported file type. Use PDF, JPG, JPEG, PNG, or WEBP.' });
    }

    if (file.size > maxSize) {
      return res.status(400).json({ message: 'File too large. Maximum size is 25MB.' });
    }

    const uniqueName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${extension}`;
    const savePath = path.join(uploadDir, uniqueName);
    await file.mv(savePath);

    return res.json({
      fileName: file.name,
      savedName: uniqueName,
      filePath: savePath,
      fileType: extension || mime,
      fileSize: file.size,
      fileUrl: `/uploads/prints/${uniqueName}`,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const payload = req.body || {};
    const rate = payload.colorMode === 'color' ? 5 : 3;
    const total = Number(payload.totalPages || 1) * Number(rate) * Number(payload.copies || 1);

    const tokenId = `#PRNT-${Math.floor(1000 + Math.random() * 9000)}`;

    const order = {
      tokenId,
      studentName: payload.studentName,
      mobile: payload.mobile,
      rollNumber: payload.rollNumber,
      department: payload.department,
      colorMode: payload.colorMode || 'bw',
      sides: payload.sides || 'single',
      orientation: payload.orientation || 'auto',
      copies: Number(payload.copies || 1),
      totalPages: Number(payload.totalPages || 1),
      pageRange: payload.pageRange || 'All Pages',
      specialInstructions: payload.specialInstructions || '',
      fileName: payload.fileName,
      filePath: payload.filePath,
      fileType: payload.fileType,
      fileSize: payload.fileSize,
      paymentProofFileName: payload.paymentProofFileName || '',
      paymentProofPath: payload.paymentProofPath || '',
      paymentProofFileType: payload.paymentProofFileType || '',
      paymentProofFileSize: payload.paymentProofFileSize || 0,
      totalAmount: total,
      paymentMethod: payload.paymentMethod || 'upi',
      printerName: payload.printerName || '',
      upiTransactionId: payload.upiTransactionId || '',
      paymentStatus: payload.paymentStatus || 'pending',
      printStatus: 'not_queued',
      status: 'queued',
      createdAt: new Date().toISOString()
    };

    if (useDatabase()) {
      const savedOrder = new PrintOrder(order);
      await savedOrder.save();
      return res.status(201).json({ success: true, order: savedOrder, tokenId, totalAmount: total, message: 'Print order created successfully' });
    }

    const storedOrder = normalizeOrder(order);
    inMemoryPrintOrders.unshift(storedOrder);
    return res.status(201).json({ success: true, order: storedOrder, tokenId, totalAmount: total, message: 'Print order created successfully (demo mode)' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/queue', adminAuth, async (req, res) => {
  try {
    if (!useDatabase()) {
      return res.json([...inMemoryPrintOrders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    }

    const orders = await PrintOrder.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id/payment-proof', adminAuth, async (req, res) => {
  try {
    let order;
    if (!useDatabase()) {
      order = inMemoryPrintOrders.find(item => item._id === req.params.id || item.tokenId === req.params.id);
    } else {
      order = await PrintOrder.findById(req.params.id);
    }

    if (!order || !order.paymentProofPath || !fs.existsSync(order.paymentProofPath)) {
      return res.status(404).json({ message: 'Payment proof not found' });
    }

    return res.sendFile(path.resolve(order.paymentProofPath));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get('/:id/file', adminAuth, async (req, res) => {
  try {
    let order;
    if (!useDatabase()) {
      order = inMemoryPrintOrders.find(item => item._id === req.params.id || item.tokenId === req.params.id);
    } else {
      order = await PrintOrder.findById(req.params.id);
    }

    if (!order || !order.filePath || !fs.existsSync(order.filePath)) {
      return res.status(404).json({ message: 'Print file not found' });
    }

    return res.sendFile(path.resolve(order.filePath));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get('/available-printers', async (req, res) => {
  try {
    return res.json({ printers: await getPrinterNames() });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get('/printer-settings', adminAuth, async (req, res) => {
  try {
    return res.json({ printers: await getPrinterNames() });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.put('/printer-settings', adminAuth, async (req, res) => {
  try {
    const printers = [...new Set((Array.isArray(req.body?.printers) ? req.body.printers : [])
      .map(printer => String(printer).trim())
      .filter(Boolean))];
    if (printers.length > 20) return res.status(400).json({ message: 'You can save up to 20 printers.' });

    if (!useDatabase()) {
      inMemoryPrinters = printers;
      return res.json({ printers });
    }

    const config = await PrinterConfig.findOneAndUpdate(
      { key: 'default' },
      { key: 'default', printers, updatedAt: new Date() },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    return res.json({ printers: config.printers });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get('/agent/jobs', printAgentAuth, async (req, res) => {
  try {
    const printerName = String(req.query.printerName || '').trim();
    if (!printerName) return res.status(400).json({ message: 'printerName is required' });

    if (!useDatabase()) {
      const job = inMemoryPrintOrders.find(order => order.paymentStatus === 'paid'
        && order.printStatus === 'queued'
        && order.printerName === printerName);
      if (!job) return res.json({ job: null });
      job.printStatus = 'printing';
      job.updatedAt = new Date().toISOString();
      return res.json({ job });
    }

    const job = await PrintOrder.findOneAndUpdate(
      { paymentStatus: 'paid', printStatus: 'queued', printerName },
      { printStatus: 'printing', updatedAt: new Date() },
      { sort: { printQueuedAt: 1 }, new: true }
    );
    return res.json({ job: job || null });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get('/agent/jobs/:id/file', printAgentAuth, async (req, res) => {
  try {
    const order = useDatabase()
      ? await PrintOrder.findById(req.params.id)
      : inMemoryPrintOrders.find(item => item._id === req.params.id || item.tokenId === req.params.id);
    if (!order || order.paymentStatus !== 'paid' || order.printStatus !== 'printing' || !order.filePath || !fs.existsSync(order.filePath)) {
      return res.status(404).json({ message: 'Paid printing job file not found' });
    }
    return res.sendFile(path.resolve(order.filePath));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.patch('/agent/jobs/:id', printAgentAuth, async (req, res) => {
  try {
    const { printStatus, printError } = req.body || {};
    if (!['printed', 'failed'].includes(printStatus)) return res.status(400).json({ message: 'Invalid print status' });
    const update = { printStatus, printError: printError || '', updatedAt: new Date() };
    if (printStatus === 'printed') update.printedAt = new Date();
    if (!useDatabase()) {
      const job = inMemoryPrintOrders.find(item => item._id === req.params.id || item.tokenId === req.params.id);
      if (!job || job.paymentStatus !== 'paid') return res.status(404).json({ message: 'Paid print job not found' });
      Object.assign(job, { ...update, updatedAt: update.updatedAt.toISOString(), printedAt: update.printedAt?.toISOString() });
      return res.json({ job });
    }
    const job = await PrintOrder.findOneAndUpdate({ _id: req.params.id, paymentStatus: 'paid', printStatus: 'printing' }, update, { new: true });
    if (!job) return res.status(404).json({ message: 'Paid print job not found' });
    return res.json({ job });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.patch('/:id/payment-status', adminAuth, async (req, res) => {
  try {
    const { paymentStatus } = req.body || {};
    if (!['pending', 'paid', 'rejected'].includes(paymentStatus)) {
      return res.status(400).json({ message: 'Invalid payment status' });
    }

    if (!useDatabase()) {
      const order = inMemoryPrintOrders.find(item => item._id === req.params.id || item.tokenId === req.params.id);
      if (!order) return res.status(404).json({ message: 'Order not found' });
      if (paymentStatus === 'paid' && order.paymentMethod === 'razorpay' && order.paymentStatus !== 'paid') {
        return res.status(400).json({ message: 'Razorpay payments must be verified online.' });
      }
      order.paymentStatus = paymentStatus;
      order.paymentVerifiedAt = paymentStatus === 'paid' ? new Date().toISOString() : undefined;
      const updatedOrder = paymentStatus === 'paid' ? await queuePaidOrder(order) : order;
      return res.json(updatedOrder);
    }

    const currentOrder = await PrintOrder.findById(req.params.id);
    if (!currentOrder) return res.status(404).json({ message: 'Order not found' });
    if (paymentStatus === 'paid' && currentOrder.paymentMethod === 'razorpay' && currentOrder.paymentStatus !== 'paid') {
      return res.status(400).json({ message: 'Razorpay payments must be verified online.' });
    }

    let order = await PrintOrder.findByIdAndUpdate(
      req.params.id,
      { paymentStatus, paymentVerifiedAt: paymentStatus === 'paid' ? new Date() : null, updatedAt: new Date() },
      { new: true }
    );
    if (paymentStatus === 'paid') order = await queuePaidOrder(order);
    return res.json(order);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.patch('/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const fulfillmentStatuses = ['printing', 'late_printing', 'ready_for_pickup', 'collected'];

    if (!useDatabase()) {
      const index = inMemoryPrintOrders.findIndex(order => order._id === req.params.id || order.tokenId === req.params.id);
      if (index === -1) {
        return res.status(404).json({ message: 'Order not found' });
      }

      if (fulfillmentStatuses.includes(status) && inMemoryPrintOrders[index].paymentStatus !== 'paid') {
        return res.status(400).json({ message: 'Verify the UPI payment before moving this order forward.' });
      }

      inMemoryPrintOrders[index].status = status;
      inMemoryPrintOrders[index].updatedAt = new Date().toISOString();
      return res.json(inMemoryPrintOrders[index]);
    }

    const currentOrder = await PrintOrder.findById(req.params.id);
    if (!currentOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (fulfillmentStatuses.includes(status) && currentOrder.paymentStatus !== 'paid') {
      return res.status(400).json({ message: 'Verify the UPI payment before moving this order forward.' });
    }

    const order = await PrintOrder.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.queuePaidOrder = queuePaidOrder;

module.exports = router;
