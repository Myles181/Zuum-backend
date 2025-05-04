const express = require('express');
const { allUsers, login, signup, verifyEmail, resendOtp, deactivateUser, updateBeatPurchase, 
    getDistributionRequests, readDistributionRequest, getRecentBeatPurchases } = require('../controllers/Admin.controller');
const { adminTokenRequired, adminSigninValidator } = require('../middleware/Auth.middleware')
const router = express.Router();




/**
 * @swagger
 * /api/admin/auth/login:
 *   post:
 *     summary: Admin login
 *     tags: [Admin]
 *     description: Login into admin account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       201:
 *         description: User registered successfully. OTP sent to email.
 *       400:
 *         description: Validation errors.
 *       406:
 *         description: Email already exists.
 *       500:
 *         description: Server error.
 */
router.post('/auth/login', ...adminSigninValidator, login);

/**
 * @swagger
 * /api/admin/auth/signup:
 *   post:
 *     summary: Admin Signup
 *     tags: [Admin]
 *     description: Registers a new admin and sends an OTP for email verification.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       201:
 *         description: Admin registered successfully. OTP sent to email.
 *       400:
 *         description: Validation errors.
 *       406:
 *         description: Email already exists.
 *       500:
 *         description: Server error.
 */
router.post('/auth/signup', signup);


/**
 * @swagger
 * /api/admin/auth/verify-email:
 *   post:
 *     summary: Verify Email
 *     tags: [Admin]
 *     description: Verifies user's email using an OTP.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verified successfully.
 *       400:
 *         description: Invalid OTP.
 *       500:
 *         description: Server error.
 */
router.post('/auth/verify-email', verifyEmail);

/**
 * @swagger
 * /api/admin/auth/resend-otp:
 *   post:
 *     summary: Resend OTP
 *     tags: [Admin]
 *     description: Resends an OTP to the user's email.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: New OTP sent to email.
 *       500:
 *         description: Server error.
 */
router.post('/auth/resend-otp', resendOtp);


/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users
 *     tags: [Admin]
 *     description: Login into admin account
 *     responses:
 *       201:
 *         description: User registered successfully. OTP sent to email.
 *       400:
 *         description: Validation errors.
 *       406:
 *         description: Email already exists.
 *       500:
 *         description: Server error.
 */
router.get('/users', adminTokenRequired, allUsers);


/**
 * @swagger
 * /api/admin/auth/deactivate:
 *   post:
 *     summary: Deactivate a user account
 *     tags: [Admin]
 *     description: Deactivate a user account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: New OTP sent to email.
 *       500:
 *         description: Server error.
 */
router.get('/deactivate', adminTokenRequired, deactivateUser);

/**
 * @swagger
 * /api/admin/distribution-requests/read:
 *   post:
 *     summary: Mark a distribution request as read or unread
 *     tags: [Admin]
 *     description: Update the `read` status of a distribution request by its ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - read
 *               - distributionId
 *             properties:
 *               read:
 *                 type: boolean
 *                 description: The new read status (true or false).
 *               distributionId:
 *                 type: integer
 *                 description: The ID of the distribution request to update.
 *     responses:
 *       200:
 *         description: Distribution request updated successfully.
 *       400:
 *         description: Required fields missing.
 *       404:
 *         description: Distribution request does not exist.
 *       500:
 *         description: Server error.
 */
router.post('/distribution-requests/read', adminTokenRequired, readDistributionRequest);


/**
 * @swagger
 * /api/admin/distribution-requests:
 *   get:
 *     summary: Get all distribution requests
 *     tags: [Admin]
 *     description: Retrieve all distribution requests. You can filter by read status using the `read` query parameter.
 *     parameters:
 *       - in: query
 *         name: read
 *         schema:
 *           type: string
 *           enum: [true, false, none]
 *         description: Filter by read status (true, false). If omitted or "none", all requests will be returned.
 *     responses:
 *       200:
 *         description: Successfully retrieved distribution requests.
 *       500:
 *         description: Server error.
 */
router.get('/distribution-requests', adminTokenRequired, getDistributionRequests);

/**
 * @swagger
 * /api/admin/beat/update-purchase:
 *   post:
 *     summary: Submit beat purchase license
 *     tags: [Beats]
 *     description: Upload a license PDF file and update send_email flag for a beat purchase.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               beat_purchase_id:
 *                 type: string
 *                 description: ID of the beat purchase to update
 *               send_email:
 *                 type: boolean
 *                 description: Whether to send the license to the user
 *               license:
 *                 type: string
 *                 format: binary
 *                 description: PDF license file to upload
 *     responses:
 *       200:
 *         description: Updated successfully
 *       400:
 *         description: beat_purchase_id is required
 *       406:
 *         description: License must be a PDF file
 *       404:
 *         description: Beat Purchase ID not found
 *       500:
 *         description: License upload or server error
 */
router.post('/beat/update-purchase', adminTokenRequired, updateBeatPurchase);

/**
 * @swagger
 * /api/admin/beat/recent-purchases:
 *   get:
 *     summary: Get recent beat purchases
 *     tags: [Beats]
 *     description: Retrieve paginated list of recent beat purchases, optionally filtered by send_email flag.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         required: false
 *         description: "Page number for pagination (default: 1)"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         required: false
 *         description: "Number of items per page (default: 10)"
 *       - in: query
 *         name: send_email
 *         schema:
 *           type: boolean
 *         required: false
 *         description: Filter by whether the email was sent or not
 *     responses:
 *       200:
 *         description: Recent purchases retrieved successfully
 *       500:
 *         description: Server error while retrieving recent purchases
 */
router.get('/beat/recent-purchases', adminTokenRequired, getRecentBeatPurchases);


module.exports = router;