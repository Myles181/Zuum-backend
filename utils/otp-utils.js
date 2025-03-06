const crypto = require("crypto");
const db = require("../config/db.conf");

// Generate a 6-digit OTP
exports.generateOtp = () => {
    return crypto.randomInt(100000, 999999).toString();
};

// Save OTP in the database
exports.saveOtp = async (email, otp) => {
    await db.query(
        "INSERT INTO otp (email, code, status) VALUES ($1, $2, 'pending')",
        [email, otp]
    );
};

// Validate OTP (Check if it's correct and not expired)
exports.validateOtp = async (email, otp) => {
    const { rows } = await db.query(
        "SELECT * FROM otp WHERE email = $1 AND code = $2 AND status = 'pending' ORDER BY created_at DESC LIMIT 1",
        [email, otp]
    );

    if (rows.length === 0) return { valid: false, reason: "Invalid OTP" };

    const otpRecord = rows[0];
    const otpCreatedAt = new Date(otpRecord.created_at);
    const now = new Date();
    const timeDiff = (now - otpCreatedAt) / (1000 * 60); // Difference in minutes

    if (timeDiff > 15) {
        await db.query(
            "UPDATE otp SET status = 'failed' WHERE id = $1",
            [otpRecord.id]
        );
        return { valid: false, reason: "OTP expired" };
    }

    return { valid: true, otpId: otpRecord.id };
};
