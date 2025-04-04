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
 *       200:
 *         description: Payment initiated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'Payment initiated. Please complete the bank transfer.'
 *                 paymentDetails:
 *                   type: object
 *                   properties:
 *                     accountNumber:
 *                       type: string
 *                       example: '7048568350'
 *                     bankName:
 *                       type: string
 *                       example: 'Flutterwave Bank'
 *                     amount:
 *                       type: string
 *                       example: '1000.00'
 *                     account_expiration:
 *                       type: string
 *                       example: '2023-10-01T12:00:00Z'
 *                     reference:
 *                       type: string
 *                       example: 'flw-1234567890'
 *       401:
 *         description: Unauthorized - missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: 'Authentication token is missing or invalid.'
 *       404:
 *         description: Payment plan not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: 'Payment plan not found'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: 'Failed to initiate payment'
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