const express = require('express');
const { allUsers, login, signup, verifyEmail, resendOtp } = require('../controllers/Admin.controller');
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


module.exports = router;