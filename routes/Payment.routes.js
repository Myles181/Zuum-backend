// routes/payment.routes.js
const router = require('express').Router();
const { tokenRequired, onlyDev, tokenProfileRequired } = require('../middleware/Auth.middleware');
const { createVirtualAccount, subscriptionPayment, initializePaymentPlans, getAccountDetails, withdrawFunds, getPaymentPlan, promotePost, transactionHistory } = require('../controllers/Payment.controller');
const { handleFlutterwaveWebhook } = require('../controllers/Webhook.controller');

/**
 * @swagger
 * /api/payment/deposit-account:
 *   get:
 *     summary: Deposit a funds with transfer payment
 *     tags: [Payment, Dashboard]
 *     security:
 *       - cookieAuth: []
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
router.get('/deposit-account', tokenRequired, createVirtualAccount);

/**
 * @swagger
 * /api/payment/withdrawal:
 *   post:
 *     summary: Initiate a withdrawal. When a user hits save=true then the withdrawal account inputted saves. if not it doesn't. When a user saves the withdrawal account the accountNumber and bankCode can be left empty and save should be false
 *     tags: [Payment, Dashboard]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: float
 *                 example: "5000.00"
 *               accountNumber:
 *                 type: string
 *                 example: "03984983983"
 *               bankCode:
 *                 type: string
 *                 example: '048'
 *               save:
 *                 type: boolean
 *                 example: true | false
 * 
 *     responses:
 *       200:
 *         description: Withdrawal initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Withdrawal initiated successfully'
 *                 data:
 *                   type: object
 *                   properties:
 *                     bank_code:
 *                       type: string
 *                       example: '048'
 *                     bank_name:
 *                       type: string
 *                       example: 'Accessbank'
 *                     amount:
 *                       type: string
 *                       example: '1000.00'
 *                     tx_ref:
 *                       type: string
 *                       example: 'flw-1234567890'
 *       400:
 *         description: 
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
 *                   example: 'Account number and bankcode are required'
 * 
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
 *       406:
 *         description: Balance not enough
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Insufficient funds'
 * 
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
 *                   example: 'Failed to initiate withdrawal'
 */
router.post('/withdrawal', tokenRequired, withdrawFunds);

/**
* @swagger
* /api/payment/subscription:
*   get:
*     summary: Initiates a payment deposit for subscription
*     tags: [Payment]
*     security:
*       - cookieAuth: []

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
router.get('/subscription', tokenRequired, subscriptionPayment);

/**
* @swagger
* /api/payment/account-details:
*   get:
*     summary: Get withdrawal account details
*     tags: [Payment, Dashboard]
*     security:
*       - cookieAuth: []

*     responses:
*       200:
*         description: Successfully retrived account details
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
*                   example: "Successfully retrived account details"
*                 account:
*                   type: object
*                   properties:
*                     user_id: 
*                       type: string
*                       example: "3"
*                     bank_code: 
*                       type: string
*                       example: "9826"
*                     account_number:
*                       type: string
*                       example: "9839217824748"
*       404:
*         description: No account found for this user
*/
router.get('/account-details', tokenRequired, getAccountDetails);

/**
* @swagger
* /api/payment/create:
*   get:
*     summary: Get
*     tags: [Payment, Dashboard]
*     security:
*       - cookieAuth: []

*     responses:
*       200:
*         description: Successfully retrived account details
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
*                   example: "Successfully retrived account details"
*                 account:
*                   type: object
*                   properties:
*                     user_id: 
*                       type: string
*                       example: "3"
*                     bank_code: 
*                       type: string
*                       example: "9826"
*                     account_number:
*                       type: string
*                       example: "9839217824748"
*       404:
*         description: No account found for this user
*/
router.get('/create', tokenRequired, getPaymentPlan)

/**
 * @swagger
 * /api/payment/promote:
 *   post:
 *     summary: Promote a post (audio, video, or beat)
 *     description: Deducts a fee from user's balance and promotes the specified post if it exists.
 *     tags: [Transactions]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - postId
 *               - type
 *             properties:
 *               postId:
 *                 type: string
 *                 example: "125"
 *               timeline:
 *                 type: datetime
 *                 example: "2025-04-21 01:38:25.431031+00"
 *               type:
 *                 type: string
 *                 enum: [audio, video, beat]
 *                 example: "audio"
 *     responses:
 *       200:
 *         description: Post promoted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Post promoted successfully"
 *                 postId:
 *                   type: string
 *                   example: "125"
 *                 type:
 *                   type: string
 *                   example: "audio"
 *       400:
 *         description: Invalid post type
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid type"
 *       404:
 *         description: Post not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Post not found"
 *       406:
 *         description: Insufficient funds
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Insufficient funds"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Something went wrong"
 */
router.post('/promote', tokenProfileRequired, promotePost);

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