const db = require('../config/db.conf');
const axios = require('axios');

const FLUTTERWAVE_API_URL = 'https://api.flutterwave.com/v3/charges?type=bank_transfer';
const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;

console.log(FLUTTERWAVE_SECRET_KEY);

exports.initializePaymentPlans = async (req, res) => {
    // Assume admin check (e.g., req.user.role === 'admin')
    if (!req.user) {
        return res.status(403).json({ status: false, error: 'Admin access required' });
    }

    try {
        const plans = [
            { name: 'artist', description: 'Annual plan for artists', amount: 15000 },
            { name: 'label', description: 'Annual plan for labels', amount: 30000 },
            { name: 'producer', description: 'Annual plan for producers', amount: 20000 },
        ];

        for (const plan of plans) {
            await db.query(
                `INSERT INTO payment_plans (name, description, amount, frequency)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (name) DO UPDATE SET
                    description = EXCLUDED.description,
                    amount = EXCLUDED.amount,
                    updated_at = CURRENT_TIMESTAMP`,
                [plan.name, plan.description, plan.amount, 'annual']
            );
        }

        res.status(201).json({
            status: true,
            message: 'Payment plans initialized successfully',
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.createPayment = async (req, res) => {
    const user = req.user;
    const userId = user.id;
    const planName = user.identity;

    try {
        // Fetch payment plan
        const planResult = await db.query(
            'SELECT * FROM payment_plans WHERE name = $1',
            [planName]
        );
        if (planResult.rows.length === 0) {
            return res.status(404).json({ status: false, error: 'Payment plan not found' });
        }
        const plan = planResult.rows[0];
        // console.log(plan);

        // Generate unique transaction reference
        const txRef = `fluxel-${userId}-${Date.now()}`;

        // Initiate bank transfer with Flutterwave
        const response = await axios.post(
            FLUTTERWAVE_API_URL,
            {
                tx_ref: txRef,
                amount: plan.amount,
                currency: 'NGN',
                email: req.user.email,
                narration: `Payment for ${plan.name} plan`,
            },
            {
                headers: {
                    Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                },
                timeout: 50000,
            }
        );
        console.log(response.data);

        // Destructure correctly based on response structure
        const { status, meta } = response.data;
        if (status !== 'success') {
           throw new Error('Failed to initiate payment');
        }

        // Extract flw_ref from meta.authorization
        const flwRef = meta.authorization.transfer_reference; // Using transfer_reference as flw_ref

        // Store transaction
        await db.query(
        `INSERT INTO transactions (user_id, payment_plan_id, tx_ref, flw_ref, amount, currency, account_expiration)
        VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, plan.id, txRef, flwRef, plan.amount, 'NGN', meta.authorization.account_expiration]
        );

        // Send response with bank transfer details
        res.status(201).json({
        status: true,
        message: 'Payment initiated. Please complete the bank transfer.',
        paymentDetails: {
            accountNumber: meta.authorization.transfer_account,
            bankName: meta.authorization.transfer_bank,
            amount: meta.authorization.transfer_amount,
            account_expiration: meta.authorization.account_expiration,
            reference: txRef,
        },
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ status: false, error: error.message });
    }
};

