const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Order = require('../models/Order');
const adminAuth = require('../middleware/adminAuth');

let inMemoryOrders = [];

router.get('/', adminAuth, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json(inMemoryOrders);
    }

    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.json(inMemoryOrders);
  }
});

module.exports = router;
