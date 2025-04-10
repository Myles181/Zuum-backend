const express = require('express');
const passport = require('passport');
const { signup, login, forgotPassword, verifyEmail, resetPassword, resendOtp, validateUsername } = require('../controllers/Auth.controller');
const { signupValidator, signinValidator, EmailValidator, verifyEmailValidator, resetPasswordValidator } = require('../middleware/Auth.middleware')
const router = express.Router();




/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: User Signup
 *     tags: [Auth]
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
 *               firstname:
 *                   type: string
 *                   description: User's firstname
 *               lastname:
 *                   type: string
 *                   description: User's lastname
 *               middlename:
 *                   type: string
 *                   description: User's middlename
 *               phonenumber:
 *                   type: string
 *                   description: User's phonenumber
 *               identity:
 *                 type: string
 *                 description: This is the identity of the user on the platform ('artist', 'record_label', 'producer')
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
 * /api/auth/login:
 *   post:
 *     summary: User Login
 *     tags: [Auth]
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
 *       406:
 *         description: Email is not verified.
 *       500:
 *         description: Server error.
 */
router.post('/login', ...signinValidator, login);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Forgot Password
 *     tags: [Auth]
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
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset Password
 *     tags: [Auth]
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
 * /api/auth/verify-email:
 *   post:
 *     summary: Verify Email
 *     tags: [Auth]
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
 * /api/auth/resend-otp:
 *   post:
 *     summary: Resend OTP
 *     tags: [Auth]
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
 * /api/auth/validate-username:
 *   post:
 *     summary: Validates a username if it exist or not
 *     tags: [Auth]
 *     description: Validates a username if it exist or not
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: matty
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 username:
 *                   type: string
 *                   example: "matty"
 *       409:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Username already taken"
 *                 suggestions:
 *                   type: array
 *                   example: ["matty_01", "matty_02", "matty_03"]
 *       500:
 *         description: Server error.
 */
router.post('/validate-username', validateUsername)



/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Authenticate with Google
 *     tags: [Auth]
 *     description: Redirects the user to Google's authentication page.
 *     responses:
 *       302:
 *         description: Redirects to Google authentication
 */
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Google authentication callback
 *     tags: [Auth]
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
    // Send token
    const token = jwt.sign({ id: createdUser.id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({
        message: "Login successful",
        token
    });
});

router.get('/google/failure', (req, res) => {
    res.status(401).json({ error: "Authentication failed" });
})


module.exports = router;


