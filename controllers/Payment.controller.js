const db = require('../config/db.conf');
const axios = require('axios');

const FLUTTERWAVE_API_URL = 'https://api.flutterwave.com/v3/virtual-account-numbers';
const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;

console.log(FLUTTERWAVE_SECRET_KEY);

exports.initializePaymentPlans = async (req, res) => {
    // Assume admin check (e.g., req.user.role === 'admin')
    if (!req.user) {
        return res.status(403).json({ status: false, error: 'Admin access required' });
    }

    try {
        const plans = [
            { name: 'artist', description: 'Annual plan for artists', amount: 16425.00 },
            { name: 'label', description: 'Annual plan for labels', amount: 32770.00 },
            { name: 'producer', description: 'Annual plan for producers', amount: 21860.00 },
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

exports.subscriptionPayment = async (req, res) => {
    const user = req.user;
    const userId = user.id;
    const planName = user.identity;
    let planResult;

    try {
        // Step 1: Get payment plan
        planResult = await db.query('SELECT * FROM payment_plans WHERE name = $1', [planName]);
        if (!planResult.rows.length) {
            return res.status(404).json({ status: false, error: 'Payment plan not found' });
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

exports.createVirtualAccount = async (req, res) => {
  try {
    const user = req.user;

    // Generate a unique reference
    const txRef = `deposit-${user.id}-${Date.now()}`;

    // Call Flutterwave API to create virtual account
    const response = await axios.post(
      FLUTTERWAVE_API_URL,
      {
        email: user.email,
        is_permanent: false,
        bvn: "", // Optional: Include BVN if required
        tx_ref: txRef,
        phonenumber: user.phonenumber,
        firstname: user.firstname,
        lastname: user.lastname,
        amount: 1000,
        narration: `${user.firstname} ${user.lastname} Deposit Account`,
        meta: {
            user_id: user.id,
            payment_type: 'deposit'
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Store the virtual account details in your database
    const accountDetails = response.data.data;
    const userId = user.id;
    await saveAccountToDatabase(userId, accountDetails, txRef);

    // Return success response with account details
    return res.status(200).json({
      status: true,
      message: 'Virtual account created successfully',
      data: {
        accountNumber: accountDetails.account_number,
        bankName: accountDetails.bank_name,
        reference: txRef,
        expiresAt: accountDetails.expiry_date
      }
    });
    
  } catch (error) {
    console.error('Virtual account creation failed:', error.response?.data || error.message);
    return res.status(500).json({
      status: false,
      message: 'Failed to create virtual account',
      error: error.response?.data?.message || error.message
    });
  }
};


exports.withdrawFunds = async (req, res) => {
    let { amount, accountNumber, bankCode, save } = req.body;
    const user = req.user;
    const charge = 0; // Adjust if there's a withdrawal fee

    try {
        // 1. Check if user has enough balance
        if ((amount + charge) > user.balance) {
            return res.status(406).json({ message: 'Insufficient funds' });
        }

        // 2. Initiate the transfer via Flutterwave
        if (!accountNumber || !bankCode) {
            let accountDetails = await db.query(`SELECT * FROM deposit_accounts WHERE user_id = $1`, [user.id]);
            if (accountDetails.rowCount) return res.status(400).json({ status: false, error: 'Account number and bankcode are required' });

            accountNumber = accountDetails.rows[0].accountNumber;
            bankCode = accountDetails.rows[0].bankCode;
        }

        const transferPayload = {
            account_bank: bankCode, // e.g. "044" for Access Bank
            account_number: accountNumber,
            amount: amount,
            narration: 'Withdrawal from wallet',
            currency: 'NGN',
            reference: `wd_${Date.now()}`, // unique ref
            // callback_url: 'https://yourdomain.com/api/flutterwave/transfer-callback',
            debit_currency: 'NGN',
        };

        const response = await axios.post(
            'https://api.flutterwave.com/v3/transfers',
            transferPayload,
            {
                headers: {
                    Authorization: `Bearer ${FLW_SECRET_KEY}`,
                },
            }
        );

        const transfer = response.data;

        if (transfer.status === 'success') {
            // 3. Deduct balance from user and save transaction
            user.balance -= (amount + charge);
            await user.save();

            // 4. Save transaction details to database
            await db.query(
                `INSERT INTO transactions (user_id, amount, type, status, reference) VALUES ($1, $2, $3, $4, $5)`,
                [user.id, amount, 'withdrawal', 'success', transfer.data.id]
            );

            // 5. Save user account details
            if (save === true) {
                await saveAccountDetails(user.id, bankCode, accountNumber);
            }

            return res.status(200).json({
                message: 'Withdrawal initiated successfully',
                data: transfer.data
            });
        } else {
            return res.status(500).json({
                message: 'Flutterwave transfer failed',
                details: transfer.message
            });
        }

    } catch (error) {
        console.error('Withdrawal error:', error.response?.data || error.message);
        return res.status(500).json({
            status: false,
            message: 'Failed to initiate withdrawal',
            error: error.response?.data?.message || error.message
        });
    }
};

exports.getAccountDetails = async (req, res) => {
    const account = await db.query(
        `SELECT * FROM deposit_accounts
         WHERE user_id = $1`, [req.user.id]
    );

    if (account.rowCount === 0) return res.status(404).json({ message: 'No account found for this user' });

    // Return the successfully 
    return res.status(200).json({ message: 'Successfully retrived account details', account: account.rows[0] });
}

exports.getPaymentPlan = async (req, res) => {
    // Get the payment plan for the user
    const plan = await db.query(
        `SELECT * FROM payment_plans
         WHERE name = $1`, [req.user.identity]
    );

    if (plan.rowCount === 0) return res.status(404).json({ message: 'No payment plan found for this user' });

    // Return the successfully 
    return res.status(200).json({ message: 'Successfully retrived account details', paymentDetails: plan.rows[0] });
}

exports.promotePost = async (req, res) => {
    const { postId, type, timeline } = req.body;
    const profile = req.profile;

    const amount = 5000;
    const validTypes = ['beat', 'audio', 'video'];

    // Validate type
    if (!validTypes.includes(type)) {
        return res.status(400).json({ message: 'Invalid type' });
    }

    // Get the correct table name
    let tableName;
    if (type === 'beat') {
        tableName = 'post_audio_sell';
        transactionType = 'promotion_audio_sell';
    } else if (type === 'audio') {
        tableName = 'post_audio';
        transactionType = 'promotion_audio';
    } else {
        tableName = 'post_video';
        transactionType = 'promotion_video';
    }

    try {
        // Check if post exists
        const postResult = await db.query(`SELECT id FROM ${tableName} WHERE id = $1 AND profile_id = $2`, [postId, profile.id]);
        if (postResult.rowCount === 0) {
            return res.status(404).json({ message: 'Post not found or Not post owner' });
        }

        // Check if post is already on promotion
        if (postResult.rows[0].promoted===true) return res.status(409).json({ message: 'Post is already on a promotion' });

        // Check if the user if a dev
        const userDev = await db.query(`SELECT identity FROM users WHERE id = $1`, [profile.user_id]);

        if (userDev.rows[0].identity === "dev") {
            console.log("This user is a dev");

            // Promote the post
            // Promote the post
            await db.query(`INSERT INTO promotion_transactions (post_id, type, amount, active, timeline, user_id) VALUES ($1, $2, $3, $4, $5)`,
                [postId, type, amount, true, timeline, profile.user_id]
            );
            await db.query(`UPDATE ${tableName} SET promoted = $1 WHERE id = $2`, [true, postId]);

            // Record transaction
            await db.query(
                `INSERT INTO transactions (user_id, amount, type, post_id, status, created_at) VALUES ($1, $2, $3, $4, $5, NOW())`,
                [profile.id, amount, transactionType, postId, 'successful']
            );

            return res.status(200).json({
                message: 'Post promoted successfully',
                postId,
                type,
            });
        }

        // Check user balance
        if (profile.balance < amount) {
            return res.status(406).json({ message: 'Insufficient funds' });
        }

        // Deduct balance
        await db.query(
            `UPDATE profile SET balance = balance - $1 WHERE id = $2`,
            [amount, profile.id]
        );

        // Promote the post
        await db.query(`INSERT INTO promotion_transactions (post_id, type, amount, active, timeline, user_id) VALUES ($1, $2, $3, $4, $5)`,
            [postId, type, amount, true, timeline, profile.user_id]
        );
        await db.query(`UPDATE ${tableName} SET promoted = $1 WHERE id = $2`, [true, postId]);

        // Record transaction
        await db.query(
            `INSERT INTO transactions (user_id, amount, type, post_id, status, created_at) VALUES ($1, $2, $3, $4, $5, NOW())`,
            [profile.id, amount, transactionType, postId, 'successful']
        );

        return res.status(200).json({
            message: 'Post promoted successfully',
            postId,
            type,
        });
    } catch (error) {
        console.error('Error promoting post:', error.message);
        return res.status(500).json({ message: 'Something went wrong' });
    }
};


exports.transactionHistoryController = async (req, res) => {
    // Get all transactions 
    let transactionHistory = [];

    const transactions = await db.query(
        `SELECT * FROM transactions
         WHERE user_id = $1`, [req.user.id]
    );

    const audio_sell_transactions = await db.query(
        `SELECT * FROM audio_sell_transactions
         WHERE user_id = $1`, [req.user.id]
    );

    const subscription_transactions = await db.query(
        `SELECT * FROM subscription_transactions
         WHERE user_id = $1 AND status = 'successful'`, [req.user.id]
    );

    for (const i of transactions.rows) {
        transactionHistory.push({
            id: i.id,
            amount: i.amount,
            type: i.type,
            status: i.status,
            created_at: i.created_at
        });
    }

    for (const i of audio_sell_transactions.rows) {
        transactionHistory.push({
            id: i.id,
            amount: i.amount,
            type: 'audio_sell',
            purchaser_id: i.purchaser_id,
            postId: i.post_id,
            status: 'successful',
            created_at: i.created_at
        });
    }

    for (const i of subscription_transactions.rows) {
        transactionHistory.push({
            id: i.id,
            amount: i.amount,
            type: 'subscription',
            status: i.status,
            created_at: i.created_at
        });
    }

    return res.status(200).json({ status: true, data: transactionHistory });
}


// Helper function to save to database
async function saveAccountToDatabase(userId, accountDetails, reference) {
  // Implement your database saving logic here
  // Store userId, account_number, bank_name, reference, expiry_date, etc.
  await db.query(`
        INSERT INTO virtual_accounts (profile_id, order_ref, flw_ref, bank_name, account_number, created_at, expiry_date, amount)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [userId, accountDetails.order_ref, accountDetails.flw_ref, accountDetails.bank_name,
            accountDetails.account_number, accountDetails.created_at, accountDetails.expiry_date, accountDetails.amount]
    );
  console.log("Account Details",accountDetails);
  console.log("Reference", reference);
}

// Helper function to deposit accounts
async function saveAccountDetails(userId, bankCode, accountNumber) {
    // Implement your database saving logic here
    // Store userId, account_number, bank_name, reference, expiry_date, etc.
    const accountDetails = await db.query(`SELECT * FROM deposit_accounts WHERE user_id = $1`, [userId]);
    if (accountDetails.rowCount) {
        return await db.query(`
            UPDATE deposit_accounts SET bank_code = $1, account_number = $2 WHERE user_id = $3`,
            [bankCode, accountNumber, userId]
        );
    }
    
    await db.query(`
        INSERT INTO deposit_accounts (user_id, bank_code, account_number)
        VALUES ($1, $2, $3)`,
        [userId, bankCode, accountNumber]
    );
};

