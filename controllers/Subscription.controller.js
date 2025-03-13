require('dotenv').config();
const db = require('../config/db.conf.js');
const { validationResult } = require('express-validator');


exports.getSubscriptionPlans = async(req, res) => {
    const subscriptions = db.query(`SELECT * FROM subscriptions`);

    return res.status(200).json({
        message: 'Subscriptions retrieved successfully!',
        subscriptions
    });
}

exports.addSubscriptionPlan = async(req, res) => {
    const {
        name,
        amount,
        timestamp
    } = req.body;

    db.query(`INSERT INTO subscriptions`)
}
