const { body } = require('express-validator');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const db = require('../config/db.conf');


exports.adminSigninValidator = [
    body('email')
        .optional()
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format'),

    body('username')
        .optional()
        .trim()
        .notEmpty().withMessage('Username is required')
        .isLength({ min: 5 }).withMessage('Username must be at least 5 characters long'),

    body('password')
        .trim()
        .notEmpty().withMessage('Password is required')
];

exports.signupValidator = [
    body('username')
        .trim()
        .notEmpty().withMessage('Username is required')
        .isLength({ min: 5 }).withMessage('Username must be at least 5 characters long'),

    body('firstname')
        .trim().isString().withMessage('Must be a string'),

    body('lastname').isString().withMessage('Must be a string')
        .trim(),
    
    body('middlename').isString().withMessage('Must be a string')
        .trim(),

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
        // Token extra tion from cookie
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ error: 'No valid token provided' });
        }

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
        // Check if the user has paid
        // const profileData = await db.query('SELECT subscription_status FROM profile WHERE user_id = $1', [userData.rows[0]].id);
        // if (profileData && !profileData.rows[0].subscription_status) return res.status(401).json({ message: 'User is not on any subscription' });

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

exports.adminTokenRequired = async (req, res, next) => {
    try {
        // Token extra tion from cookie
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ error: 'No valid token provided' });
        }
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
        const adminData = await db.query(`SELECT * FROM admin WHERE id = $1 AND deleted = false`, [decoded.id]);

        if (adminData.rows.length === 0) {
            console.log("Admin does not exist"); // Fixed typo in message
            return res.status(404).json({ status: false, error: 'Admin not found' });
        }
        req.admin = adminData.rows[0]; // Store the actual admin object, not the query result
        next();
    } catch (err) {
        console.log(err);
        return res.status(401).json({ error: 'Invalid token' });
    }
};

exports.tokenProfileRequired = async (req, res, next) => {
    try {
        // Token extra tion from cookie
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ error: 'No valid token provided' });
        }
        let decoded;
        try {   
            decoded = jwt.verify(token, process.env.SECRET_KEY);
        } catch (err) {
            if (err.name === "TokenExpiredError") {
                return res.status(401).json({ error: "Token has expired. Please refresh your token." });
            }
            console.log("Error: ", err);
            return res.status(401).json({ error: "Invalid token" });
        }


        // Check if the user exists
        const userData = await db.query(`SELECT * FROM users WHERE id = $1 AND deleted = false`, [decoded.id]);

        if (userData.rows.length === 0) {
            console.log("User does not exist"); // Fixed typo in message
            return res.status(404).json({ status: false, error: 'User not found' });
        }
        const profileData = await db.query("SELECT * FROM profile WHERE user_id = $1", [decoded.id]);
        // if (profileData && !profileData.rows[0].subscription_status) return res.status(401).json({ message: 'User is not on any subscription' });


        req.profile = profileData.rows[0];
        next();
    } catch (err) {
        console.log(err);
        return res.status(401).json({ error: 'Invalid token' });
    }
};

exports.producerTokenRequired = async (req, res, next) => {
    try {
        // Token extra tion from cookie
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ error: 'No valid token provided' });
        }
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
        const userData = await db.query(`SELECT * FROM users WHERE id = $1 AND deleted = false`, [decoded.id]);
        const validRoles = ['producer', 'record_label']

        if (userData.rows.length === 0) {
            console.log("User does not exist"); // Fixed typo in message
            return res.status(404).json({ status: false, error: 'User not found' });
        }

        // Check if the user has the right role/identity to access the endpoint
        if (!validRoles.includes(userData.rows[0].identity)) return res.status(401).json({ message: 'Role not allowed' });

        const profileData = await db.query("SELECT * FROM profile WHERE user_id = $1", [decoded.id]);
        // if (profileData && !profileData.rows[0].subscription_status) return res.status(401).json({ message: 'User is not on any subscription' });

        req.profile = profileData.rows[0];
        next();
    } catch (err) {
        console.log(err);
        return res.status(401).json({ error: 'Invalid token' });
    }
};