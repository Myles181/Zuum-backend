const axios = require('axios');
require('dotenv').config();

const FLUTTER_WAVE_SECRET_KEY = process.env.FLUTTER_WAVE_SECRET_KEY


exports.createVirtualAccount = async (email, tx_ref, phonenumber, firstname, lastname, bvn) => {
    try {
        const response = await axios.post(
            "https://api.flutterwave.com/v3/virtual-account-numbers",
            {
                email: email,
                tx_ref: tx_ref,//"apex_tx_ref-002201",
                phonenumber: phonenumber,
                is_permanent: true,
                firstname: firstname,
                lastname: lastname,
                narration: "Create Virtual Account For Zuum Details",
                bvn: bvn
            },
            {
                headers: {
                    Authorization: `Bearer ${FLUTTER_WAVE_SECRET_KEY}`,
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

// (async () => {
//     try {
//         const result = await exports.createVirtualAccount("CUS_358xertt55", "myles");
//         console.log(result);
//     } catch (err) {
//         console.error(err);
//     }
// })();