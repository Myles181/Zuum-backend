// routes/payment.routes.js
const router = require('express').Router();
const { tokenRequired } = require('../middleware/Auth.middleware');
const { createPayment, initializePaymentPlans } = require('../controllers/Payment.controller');
const { handleFlutterwaveWebhook } = require('../controllers/Webhook.controller');

/**
 * @swagger
 * /api/payment/create:
 *   post:
 *     summary: Create a bank transfer payment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               planName:
 *                 type: string
 *                 example: "artist"
 *     responses:
 *       201:
 *         description: Payment initiated
 */
router.post('/create', tokenRequired, createPayment);

/**
 * @swagger
 * /api/payment/webhooks/flutterwave:
 *   post:
 *     summary: Handle Flutterwave webhook events
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
 *     responses:
 *       200:
 *         description: Webhook received
 */
router.get('/admin/payment-plans/initialize', tokenRequired, initializePaymentPlans);

module.exports = router;