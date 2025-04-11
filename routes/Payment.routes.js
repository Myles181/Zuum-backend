// routes/payment.routes.js
const router = require('express').Router();
const { tokenRequired, onlyDev } = require('../middleware/Auth.middleware');
const { createVirtualAccount, subscriptionPayment, initializePaymentPlans } = require('../controllers/Payment.controller');
const { handleFlutterwaveWebhook } = require('../controllers/Webhook.controller');

/**
 * @swagger
 * /api/payment/create-virtual-account:
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
router.get('/create-virtual-account', tokenRequired, createVirtualAccount);

/**
* @swagger
* /api/payment/subscription:
*   get:
*     summary: Initiates a payment deposit for subscription
*     tags: [Payment]
*     security:
*       - bearerAuth: []

*     responses:
*       200:
*         description: Payment successfully initiated
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
*                   example: "Payment initiated. Please complete the bank transfer."
*                 paymentLink:
*                   type: string
*                   example: "https://checkout.flutterwave.com/v3/hosted/pay/flwlnk-01jrgg48fxr38adp677h8pan2n"
*       401:
*         description: Unauthorized
*       404:
*         description: Payment plan not found
*       409:
*         description: User already subscribed
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
*                   example: "Server error message"
*/
router.get('/subscription', tokenRequired, onlyDev, subscriptionPayment);

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