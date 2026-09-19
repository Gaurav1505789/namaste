const Razorpay = require('razorpay');
const Order = require('../models/Order');
const crypto = require('crypto');

const razorpay = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    })
  : null;

// Create order
exports.createOrder = async (req, res) => {
  try {
    const { amount, productId, customerEmail, customerName, customerPhone } = req.body;

    if (!razorpay) {
      const demoOrderId = `demo_order_${Date.now()}`;
      const order = new Order({
        orderId: demoOrderId,
        productId,
        amount,
        razorpayOrderId: demoOrderId,
        customerEmail,
        customerName,
        customerPhone,
        status: 'pending',
        isDemo: true
      });
      await order.save().catch(() => {});

      return res.json({
        orderId: demoOrderId,
        amount: Math.round(amount * 100),
        currency: 'INR',
        key: 'rzp_test_demo',
        demo: true
      });
    }

    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1
    };

    const razorpayOrder = await razorpay.orders.create(options);

    const order = new Order({
      orderId: razorpayOrder.id,
      productId,
      amount,
      razorpayOrderId: razorpayOrder.id,
      customerEmail,
      customerName,
      customerPhone,
      status: 'pending'
    });

    await order.save();

    res.json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Verify payment
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay || !process.env.RAZORPAY_KEY_SECRET) {
      const order = await Order.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        {
          status: 'completed',
          razorpayPaymentId: razorpay_payment_id || 'demo_payment_id',
          razorpaySignature: razorpay_signature || 'demo_signature',
          downloadToken: crypto.randomBytes(32).toString('hex'),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        },
        { new: true, upsert: true }
      );

      return res.json({
        success: true,
        message: 'Payment verified successfully (demo mode)',
        downloadToken: order.downloadToken,
        demo: true
      });
    }

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature === expectedSign) {
      const order = await Order.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        {
          status: 'completed',
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          downloadToken: crypto.randomBytes(32).toString('hex'),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        },
        { new: true }
      );

      res.json({
        success: true,
        message: 'Payment verified successfully',
        downloadToken: order.downloadToken
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid signature' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get order details
exports.getOrderDetails = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate('productId');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
