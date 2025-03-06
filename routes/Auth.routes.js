const express = require('express');
const passport = require('passport');
const { signup, login, forgotPassword, verifyEmail, resetPassword, resendOtp } = require('../controllers/User.controller');
const { signupValidator, signinValidator, EmailValidator, verifyEmailValidator, resetPasswordValidator } = require('../middleware/Auth.middleware')
const router = express.Router();




/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: User Signup
 *     description: Registers a new user and sends an OTP for email verification.
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
router.post('/signup', ...signupValidator, signup);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User Login
 *     description: Authenticates a user and returns a JWT token.
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
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful. Returns JWT token.
 *       400:
 *         description: Validation errors.
 *       401:
 *         description: Invalid credentials.
 *       500:
 *         description: Server error.
 */
router.post('/login', ...signinValidator, login);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Forgot Password
 *     description: Sends a password reset link to the user's email.
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
 *         description: Reset link sent to email.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Server error.
 */
router.post('/forgot-password', ...EmailValidator, forgotPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset Password
 *     description: Resets the user's password using a token.
 * 
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: password
 *               otp:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Password reset successfully.
 *       400:
 *         description: Invalid or expired token.
 *       500:
 *         description: Server error.
 */
router.post('/reset-password', ...resetPasswordValidator, resetPassword);

/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     summary: Verify Email
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
router.post('/verify-email', ...verifyEmailValidator, verifyEmail);

/**
 * @swagger
 * /auth/resend-otp:
 *   post:
 *     summary: Resend OTP
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
router.post('/resend-otp', ...EmailValidator, resendOtp);




/**
 * @swagger
 * /auth/google:
 *   get:
 *     summary: Authenticate with Google
 *     description: Redirects the user to Google's authentication page.
 *     responses:
 *       302:
 *         description: Redirects to Google authentication
 */
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     summary: Google authentication callback
 *     description: Handles the callback from Google after authentication.
 *     responses:
 *       302:
 *         description: Redirects to dashboard after successful login
 *       401:
 *         description: Authentication failed
 */
router.get('/google/callback', 
    passport.authenticate('google', { 
        successRedirect: '/auth/google/success',
        failureRedirect: '/auth/google/failure'
    })
);

router.get('/google/success', (req, res) => {
    res.json({
        message: "Login successful",
        user: req.user
    });
});

router.get('/google/failure', (req, res) => {
    res.status(401).json({ error: "Authentication failed" });
})


module.exports = router;


