const express = require('express');
const passport = require('passport');
const { signup, login } = require('../controllers/User.controller');
const { signupValidator, signinValidator } = require('../middleware/Auth.middleware')
const router = express.Router();

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user with a hashed password.
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
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       406:
 *         description: Email or Username field already exists
 *       400:
 *         description: Field validatiion failed
 *       500:
 *         description: Internal server error
 */
router.post('/signup', ...signupValidator, signup);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticates user and returns a JWT token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Field validatiion failed
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Internal server error
 */
router.post('/login', ...signinValidator, login);

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


