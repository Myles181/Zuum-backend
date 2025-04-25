require('dotenv').config();
const db = require('../config/db.conf.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { generateOtp, saveOtp, validateOtp } = require('../utils/otp-utils.js');
const { transporter } = require('../helpers/transport.js');
const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const SECRET_KEY = process.env.SECRET_KEY;

exports.signup = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    let { username, email, password } = req.body;

    try {
        // Check if email already exists
        const emailCheck = await db.query("SELECT id FROM admin WHERE email = $1", [email]);
        if (emailCheck.rows.length > 0) {
            return res.status(409).json({ error: "Email already exists. Please log in or use a different email." });
        }

        const emailCheckuser = await db.query("SELECT id FROM users WHERE email = $1", [email]);
        if (emailCheckuser.rows.length > 0) {
            return res.status(409).json({ error: "Email already exists. Please log in or use a different email." });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the user
        const new_user = await db.query(
            "INSERT INTO admin (username, email, password, email_verified) VALUES ($1, $2, $3, $4) RETURNING id",
            [username, email, hashedPassword, false]
        );

        const userId = new_user.rows[0].id;

        // Generate and save OTP
        const otp = generateOtp();
        await saveOtp(email, otp);

        // Send OTP via Email
        // Read the verifyemail.html template dynamically
        const emailTemplatePath = path.join(__dirname, 'templates/verifyemail.html');  // Path to your HTML template
        fs.readFile(emailTemplatePath, 'utf8', (err, htmlContent) => {
            if (err) {
                console.error('Error reading email template:', err);
                return res.status(500).json({ error: 'Error generating email content.' });
            }

            // Replace placeholders with actual values
            const updatedHtml = htmlContent
                .replace('{{OTP_CODE}}', otp)
                .replace('{{VERIFY_LINK}}', `${process.env.FRONTEND_URL}/verifyemail.html`);

            // Send OTP via Email with the updated template
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: "Verify Your Email",
                html: updatedHtml,  // Use the updated HTML template
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Error sending email:', error);
                    return res.status(500).json({ error: 'Error sending email.' });
                } else {
                    console.log('Email sent:', info.response);
                }
            });
        });

        res.status(201).json({ message: "Admin registered successfully. Please verify your email." });
    } catch (error) {
        console.log(error);
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(406).json({ error: "Email already exists" });
        }
        res.status(500).json({ error: error.message });
    }
};

exports.verifyEmail = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { email, otp } = req.body;

    try {
        const { valid, reason, otpId } = await validateOtp(email, otp);

        if (!valid) {
            return res.status(400).json({ error: reason });
        }

        // Update user email_verified field
        await db.query("UPDATE admin SET email_verified = true WHERE email = $1", [email]);

        // Mark OTP as used
        await db.query("UPDATE otp SET status = 'success' WHERE id = $1", [otpId]);

        res.json({ message: "Email verified successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.resendOtp = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { email } = req.body;

    try {
        // Generate new OTP
        const newOtp = generateOtp();
        await saveOtp(email, newOtp);

        // Send OTP via Email
        // Read the verifyemail.html template dynamically
        const emailTemplatePath = path.join(__dirname, 'templates/verifyemail.html');  // Path to your HTML template
        fs.readFile(emailTemplatePath, 'utf8', (err, htmlContent) => {
            if (err) {
                console.error('Error reading email template:', err);
                return res.status(500).json({ error: 'Error generating email content.' });
            }

            // Replace placeholders with actual values
            const updatedHtml = htmlContent
                .replace('{{OTP_CODE}}', newOtp)
                .replace('{{VERIFY_LINK}}', `${process.env.FRONTEND_URL}/verifyemail.html`);

            // Send OTP via Email with the updated template
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: "Verify Your Email",
                html: updatedHtml,  // Use the updated HTML template
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Error sending email:', error);
                    return res.status(500).json({ error: 'Error sending email.' });
                } else {
                    console.log('Email sent:', info.response);
                }
            });
        });

        res.json({ message: "New OTP sent to your email" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.login = async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;
    console.log(username, email, password);

    try {
        let rows;

        if (!email && !username) return res.status(200).json({ error: 'Please provide email or username' });

        if (email) {
            rows = await db.query('SELECT * FROM admin WHERE email = $1', [email]);
        } else {
            rows = await db.query('SELECT * FROM admin WHERE username = $1', [username]);
        }

        // If user does not exist
        if (rows.rowCount === 0) return res.status(401).json({ error: 'Invalid credentials' });

        const admin = rows.rows[0];

        // Unhash password
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

        if (!admin.email_verified) return res.status(406).json({ error: 'Email is not verified' });

        console.log(SECRET_KEY);
        const token = jwt.sign({ id: admin.id }, SECRET_KEY, { expiresIn: '1d' });
        res.json({ message: 'Login successful', token });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
};

exports.deactivateUser = async (req, res) => {
    const { userId } = req.body;

    try {
        // Check if user exists
        const user = await db.query(`SELECT id FROM users WHERE id = $1`, [userId]);
        if (user.rowCount === 0) return res.status(404).json({ error: 'User not found' });

        // Check if user is already deactivated
        let change = user.rows[0].deactivated ? true : false;
        
        // Update the user table
        await db.query('UPDATE users SET deactivated = $1 WHERE id = $2', [change, userId]);
        res.json({ message: 'User deactivated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

exports.allUsers = async (req, res) => {
    const { page = 1, limit = 10, search = "" } = req.query;
    const offset = (page - 1) * limit;
    const searchQuery = `%${search}%`;

    try {
        // Query total count
        const countResult = await db.query(
            `SELECT COUNT(*) FROM users 
             WHERE username ILIKE $1 
                OR firstname ILIKE $1 
                OR lastname ILIKE $1`,
            [searchQuery]
        );

        const total = parseInt(countResult.rows[0].count);

        const results = ['id', 'username', 'email', 'firstname', 'lastname', 'middlename', 'phonenumber', 'identity', 'deactivated', 'created_at']

        // Query paginated users
        const usersResult = await db.query(
            `SELECT ${results} FROM users 
             WHERE username ILIKE $1 
                OR firstname ILIKE $1 
                OR lastname ILIKE $1 
             ORDER BY created_at DESC 
             LIMIT $2 OFFSET $3`,
            [searchQuery, limit, offset]
        );

        res.json({
            total: total,
            users: usersResult.rows,
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong." });
    }
};

exports.getDistributionRequests = async (req, res) => {
    const { read } = req.query;

    try {
        let query = 'SELECT * FROM distribution_requests';
        const values = [];

        if (read === 'true' || read === 'false') {
            query += ' WHERE read = $1';
            values.push(read === 'true');
        }

        query += ' ORDER BY created_at DESC';

        const result = await db.query(query, values);
        res.status(200).json({ data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Something went wrong' });
    }
};

exports.readDistributionRequest = async (req, res) => {
    const { read, distributionId } = req.body;

    if (!read || !distributionId) return res.status(400).json({ message: 'Required Fields missing' });

    const result = await db.query(`
        UPDATE distribution_requests
        SET read = $1
        WHERE id = $2`, [read, distributionId]
    );

    if (result.rowCount === 0) return res.status(404).json({ message: 'Distribution request does not exist' });

    return res.status(200).json({ message: 'Distribution request successfult', result: result.rows[0] });
};
