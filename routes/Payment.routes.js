// routes/payment.routes.js
const router = require('express').Router();
const { tokenRequired } = require('../middleware/Auth.middleware');
const { createPayment, initializePaymentPlans } = require('../controllers/Payment.controller');
const { handleFlutterwaveWebhook } = require('../controllers/Webhook.controller');

/**
 * @swagger
 * /api/payment/create:
 *   get:
 *     summary: Create a bank transfer payment
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Payment initiated
 */
router.get('/create', tokenRequired, createPayment);

/**
 * @swagger
 * /api/payment/webhooks/flutterwave:
 *   post:
 *     summary: Handle Flutterwave webhook events
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event:
 *                 type: string
 *               data:
 *                 type: object
 *     responses:
 *       200:
 *         description: Webhook received
 */
router.post('/webhooks/flutterwave', handleFlutterwaveWebhook);


/**
 * @swagger
 * /api/payment/admin/payment-plans/initialize:
 *   get:
 *     summary: Handle Flutterwave webhook events
 *     tags: [Payment]
 *     responses:
 *       200:
 *         description: Webhook received
 */
router.get('/admin/payment-plans/initialize', tokenRequired, initializePaymentPlans);

module.exports = router;