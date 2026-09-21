const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const mongoose = require('mongoose');
const router = express.Router();
const PrintOrder = require('../models/PrintOrder');
const adminAuth = require('../middleware/adminAuth');

const uploadDir = path.join(__dirname, '..', 'uploads', 'prints');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
const maxSize = 25 * 1024 * 1024;
let inMemoryPrintOrders = [];

const useDatabase = () => mongoose.connection.readyState === 1;

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
      upiTransactionId: payload.upiTransactionId || '',
      paymentStatus: payload.paymentStatus || 'pending',
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

router.patch('/:id/payment-status', adminAuth, async (req, res) => {
  try {
    const { paymentStatus } = req.body || {};
    if (!['pending', 'paid', 'rejected'].includes(paymentStatus)) {
      return res.status(400).json({ message: 'Invalid payment status' });
    }

    if (!useDatabase()) {
      const order = inMemoryPrintOrders.find(item => item._id === req.params.id || item.tokenId === req.params.id);
      if (!order) return res.status(404).json({ message: 'Order not found' });
      order.paymentStatus = paymentStatus;
      order.paymentVerifiedAt = paymentStatus === 'paid' ? new Date().toISOString() : undefined;
      return res.json(order);
    }

    const order = await PrintOrder.findByIdAndUpdate(
      req.params.id,
      { paymentStatus, paymentVerifiedAt: paymentStatus === 'paid' ? new Date() : null, updatedAt: new Date() },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: 'Order not found' });
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

module.exports = router;
