const { body } = require('express-validator');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const db = require('../config/db.conf');



exports.signupValidator = [
    body('username')
        .trim()
        .notEmpty().withMessage('Username is required')
        .isLength({ min: 5 }).withMessage('Username must be at least 5 characters long'),
    
    body('identity')
        .trim()
        .notEmpty().withMessage('Identity field required'),
    
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .isLength({ min: 5 }).withMessage('Email must be at least 5 characters long'),

    body('password')
        .trim()
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
];

exports.signinValidator = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format'),

    body('password')
        .trim()
        .notEmpty().withMessage('Password is required')
];

exports.EmailValidator = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
];

exports.resetPasswordValidator = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format'),

    body('newPassword')
        .trim()
        .notEmpty().withMessage('Password is required'),
    
    body('token')
        .trim()
        .notEmpty().withMessage('Otp is required')
];

exports.verifyEmailValidator = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format'),

    body('otp')
        .trim()
        .notEmpty().withMessage('Otp is required')
];

exports.tokenRequired = async (req, res, next) => {
    try {
        // Token extraction looks good
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No valid token provided' });
        }

        const token = authHeader.split(' ')[1];
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.SECRET_KEY);
        } catch (err) {
            if (err.name === "TokenExpiredError") {
                return res.status(401).json({ error: "Token has expired. Please refresh your token." });
            }
            return res.status(401).json({ error: "Invalid token" });
        }

        // Check if the user exists
        const userData = await db.query("SELECT * FROM users WHERE id = $1 AND deleted = false", [decoded.id]); // Fixed placeholder syntax
        if (userData.rows.length === 0) { // Fixed condition - userData is a query result object
            console.log("User does not exist"); // Fixed typo in message
            return res.status(404).json({ status: false, error: 'User not found' });
        }

        req.user = userData.rows[0]; // Store the actual user object, not the query result
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

exports.onlyDev = (req, res, next) => {
    req.onlyDev = 'activated';
    next();
};

exports.tokenProfileRequired = async (req, res, next) => {
    try {
        // Token extraction looks good
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No valid token provided' });
        }

        const token = authHeader.split(' ')[1];
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.SECRET_KEY);
        } catch (err) {
            if (err.name === "TokenExpiredError") {
                return res.status(401).json({ error: "Token has expired. Please refresh your token." });
            }
            return res.status(401).json({ error: "Invalid token" });
        }


        // Check if the user exists
        const userData = await db.query("SELECT * FROM users WHERE id = $1 AND deleted = false", [decoded.id]);
        if (userData.rows.length === 0) { // Fixed condition - userData is a query result object
            console.log("User does not exist"); // Fixed typo in message
            return res.status(404).json({ status: false, error: 'User not found' });
        }
        const profileData = await db.query("SELECT * FROM profile WHERE user_id = $1", [decoded.id]);

        req.profile = profileData.rows[0];
        next();
    } catch (err) {
        console.log(err);
        return res.status(401).json({ error: 'Invalid token' });
    }
};

