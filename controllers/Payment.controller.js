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

// exports.depositPayment = async (req, res) => {
//     const user = req.user;
//     const userId = user.id;
//     const planName = user.identity;
//     let planResult;

//     try {
//         if (req.onlyDev === 'activated') {
//             // return res.status(401).json({ status: false, error: 'Unauthorized' });

//             // Fetch payment plan
//             planResult = await db.query(
//                 'SELECT * FROM payment_plans WHERE name = $1',
//                 ['onlyDev']
//             );
//             if (! planResult.rows.length) {
//                 planResult = await db.query('INSERT INTO payment_plans (name, description, amount, frequency) VALUES ($1, $2, $3, $4) RETURNING *', ['onlyDev', 'Test Plan', 50, 'monthly']);
//             }
//         }
//         else {// Fetch payment plan
//             planResult = await db.query(
//                 'SELECT * FROM payment_plans WHERE name = $1',
//                 [planName]
//             );
        
//             if (planResult.rows.length === 0) {
//                 return res.status(404).json({ status: false, error: 'Payment plan not found' });
//             }
//         }
//         const plan = planResult.rows[0];
//         // console.log(plan);

//         // Check if user already on a plan
//         const subscriptionExist = await db.query(`SELECT transaction_id, subscription_status FROM profile WHERE user_id = $1`, [userId]);
//         if (subscriptionExist.rows[0].subscription_status === 'completed') {

//             const transactionExists = await db.query(`
//                 SELECT * FROM subscription_transactions
//                 WHERE user_id = $1 AND transaction_id = $2`,
//                 [userId, subscriptionExist.rows[0].transaction_id]
//             );

//             if (transactionExists.rowCount === 0 || transactionExists.rows[0].status !== 'success') {
//                 // Change the Profile payment status to false
//                 await db.query(
//                     `UPDATE profile
//                      SET subscription_status = $1
//                      WHERE user_id = $2`,['false', userId]
//                     );
//             } else {
//                 return res.status(409).json({ message: 'User already subscribed' });
//             }
//         }

//         // Generate unique transaction reference
//         const txRef = `fluxel-${userId}-${Date.now()}`;

//         // Initiate bank transfer with Flutterwave
//         const response = await axios.post(
//             FLUTTERWAVE_API_URL,
//             {
//                 tx_ref: txRef,
//                 amount: plan.amount,
//                 currency: 'NGN',
//                 email: req.user.email,
//                 narration: `Payment for ${plan.name} plan`,
//                 meta: {
//                     payment_type: "subscription",
//                     plan_name: plan.name,
//                     user_id: userId
//                 }
//             },
//             {
//                 headers: {
//                     Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
//                     'Content-Type': 'application/json',
//                 },
//                 timeout: 50000,
//             }
//         );
//         console.log(response.data);

//         // Destructure correctly based on response structure
//         const { status, meta } = response.data;
//         if (status !== 'success') {
//            throw new Error('Failed to initiate payment');
//         }

//         // Extract flw_ref from meta.authorization
//         const flwRef = meta.authorization.transfer_reference; // Using transfer_reference as flw_ref

//         // Store transaction
//         await db.query(
//         `INSERT INTO subscription_transactions (user_id, payment_plan_id, tx_ref, flw_ref, amount, currency, account_expiration)
//         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
//         [userId, plan.id, txRef, flwRef, plan.amount, 'NGN', meta.authorization.account_expiration]
//         );

//         // Send response with bank transfer details
//         res.status(200).json({
//         status: true,
//         message: 'Payment initiated. Please complete the bank transfer.',
//         paymentDetails: {
//             accountNumber: meta.authorization.transfer_account,
//             bankName: meta.authorization.transfer_bank,
//             amount: meta.authorization.transfer_amount,
//             account_expiration: meta.authorization.account_expiration,
//             reference: txRef,
//         },
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ status: false, error: error.message });
//     }
// };

exports.subscriptionPayment = async (req, res) => {
    const user = req.user;
    const userId = user.id;
    const planName = user.identity;
    let planResult;

    try {
        // Step 1: Get payment plan
        if (req.onlyDev === 'activated') {
            planResult = await db.query('SELECT * FROM payment_plans WHERE name = $1', ['onlyDev']);
            if (!planResult.rows.length) {
                planResult = await db.query(
                    'INSERT INTO payment_plans (name, description, amount, frequency) VALUES ($1, $2, $3, $4) RETURNING *',
                    ['onlyDev', 'Test Plan', 50, 'monthly']
                );
            }
        } else {
            planResult = await db.query('SELECT * FROM payment_plans WHERE name = $1', [planName]);
            if (!planResult.rows.length) {
                return res.status(404).json({ status: false, error: 'Payment plan not found' });
            }
        }

        const plan = planResult.rows[0];

        // Step 2: Check if user is already subscribed
        const subscriptionExist = await db.query(
            `SELECT transaction_id, subscription_status FROM profile WHERE user_id = $1`,
            [userId]
        );

        if (subscriptionExist.rows[0]?.subscription_status === 'completed') {
            const transactionExists = await db.query(
                `SELECT * FROM subscription_transactions WHERE user_id = $1 AND transaction_id = $2`,
                [userId, subscriptionExist.rows[0].transaction_id]
            );

            if (transactionExists.rowCount === 0 || transactionExists.rows[0].status !== 'success') {
                await db.query(
                    `UPDATE profile SET subscription_status = $1 WHERE user_id = $2`,
                    ['false', userId]
                );
            } else {
                return res.status(409).json({ message: 'User already subscribed' });
            }
        }

        // Step 3: Prepare payment request
        const txRef = `fluxel-${userId}-${Date.now()}`;

        const flutterResponse = await axios.post(
            'https://api.flutterwave.com/v3/payments',
            {
                tx_ref: txRef,
                amount: plan.amount,
                currency: 'NGN',
                payment_options: 'banktransfer',
                redirect_url: 'https://yourdomain.com/payment/callback', // optional but good for logs
                customer: {
                    email: user.email,
                    phonenumber: user.phone || '',  // make sure to have a `phone` column in user or omit if not needed
                    name: user.name || user.email
                },
                customizations: {
                    title: 'Fluxel',
                    description: `Payment for ${plan.name} plan`
                },
                meta: {
                    user_id: userId,  // Important: used in webhook handler
                    payment_type: 'subscription'  // This tells your webhook it's a subscription
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 50000
            }
        );

        const paymentData = flutterResponse.data;

        if (paymentData.status !== 'success') {
            throw new Error(paymentData.message || 'Failed to initiate payment');
        }

        // Step 4: Save transaction details
        await db.query(
            `INSERT INTO subscription_transactions (user_id, payment_plan_id, tx_ref, flw_ref, amount, currency, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                userId,
                plan.id,
                txRef,
                paymentData.data.tx_ref,
                plan.amount,
                'NGN',
                'pending'
            ]
        );

        // Step 5: Return the payment info (link or bank details)
        res.status(200).json({
            status: true,
            message: 'Payment initiated. Follow the instructions below to complete the payment.',
            paymentLink: paymentData.data.link, // this will show a page with bank transfer instructions
        });

    } catch (error) {
        console.error('Deposit Payment Error:', error.message || error);
        res.status(500).json({ status: false, error: error.message || 'Internal Server Error' });
    }
};


exports.transferFunds = async (req, res) => {
    const { tx_ref, amount, currency } = req.body; // Assuming these are passed in the request body

    try {
        // Check if transaction exists
        const transactionResult = await db.query(
            'SELECT * FROM subscription_transactions WHERE tx_ref = $1',
            [tx_ref]
        );

        if (transactionResult.rows.length === 0) {
            return res.status(404).json({ status: false, error: 'Transaction not found' });
        }

        const transaction = transactionResult.rows[0];

        // Update transaction status to success
        await db.query(
            'UPDATE subscription_transactions SET status = $1 WHERE tx_ref = $2',
            ['success', tx_ref]
        );

        // Update user subscription status
        await db.query(
            `INSERT INTO user_subscriptions (user_id, payment_plan_id, start_date, end_date)
             VALUES ($1, $2, NOW(), NOW() + INTERVAL '1 year')`,
            [transaction.user_id, transaction.payment_plan_id]
        );

        res.status(200).json({
            status: true,
            message: 'Payment successful',
            transaction: {
                tx_ref,
                amount,
                currency,
                status: 'success',
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: false, error: error.message });
    }
}

