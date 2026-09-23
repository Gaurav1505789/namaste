const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.post('/create-order', paymentController.createOrder);
router.post('/create-print-order', paymentController.createPrintOrderPayment);
router.post('/verify', paymentController.verifyPayment);
router.get('/order/:orderId', paymentController.getOrderDetails);

module.exports = router;
