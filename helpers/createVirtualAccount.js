const axios = require('axios');
require('dotenv').config();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY


exports.createVirtualAccount = async (customerCode, username) => {
    try {
        const response = await axios.post(
            "https://api.paystack.co/dedicated_account",
            {
                customer: customerCode,
                first_name: username,
                last_name: "ZUUM",
                preferred_bank: "titan-paystack"
            },
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("✅ Virtual Account Created:", response.data);
        return response.data;
    } catch (error) {
        console.error("❌ Error creating virtual account:", error.response?.data || error.message);
        throw error;
    }
};

(async () => {
    try {
        const result = await exports.createVirtualAccount("CUS_358xertt55", "myles");
        console.log(result);
    } catch (err) {
        console.error(err);
    }
})();