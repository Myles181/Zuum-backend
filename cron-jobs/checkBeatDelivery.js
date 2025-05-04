const pool = require('../config/db.conf.js');
const cron = require('node-cron');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const { transporter } = require('../helpers/transport.js');


const checkBeatDelivery = async () => {
    const client = await pool.connect();
    try {
        // Fetch all active promotions
        // const pendingDeliveries = await client.query(`
        //     SELECT * FROM audio_purchases
        //     delivered = false AND send_email = true
        // `);
        const pendingDeliveries = await client.query(`
            SELECT 
                ap.*, 
                u.username,
                pas.audio_caption,
            FROM 
                audio_purchases ap
            JOIN 
                profile p ON ap.profile_id = p.id
            JOIN 
                users u ON p.user_id = u.id
            JOIN
                post_audio_sell pas ON ap.post_id = pas.id
            WHERE 
                ap.delivered = false 
                AND ap.send_email = true
        `);


        for (const deliveries of pendingDeliveries.rows) {
            if (deliveries.license) {
                // TODO: Send the user  the email containing the beat audio and the license of the beat (e.g., via email)
                const audioDownloadUrl = cloudinary.url(deliveries.audio_upload, {
                    resource_type: 'video', // or 'raw' for .mp3 if uploaded as raw
                    transformation: [{ flags: 'attachment' }]
                });

                const licenseDownloadUrl = cloudinary.url(deliveries.license, {
                    resource_type: 'raw', // or 'raw' for .mp3 if uploaded as raw
                    transformation: [{ flags: 'attachment' }]
                });

                const user = await client.query(`
                    SELECT * FROM profile
                    WHERE id = $1`,
                    [deliveries.purchaser_id]
                );

                const emailTemplatePath = path.join(__dirname, 'templates/supply_beats.html');  // Path to your HTML template
                fs.readFile(emailTemplatePath, 'utf8', (err, htmlContent) => {
                    if (err) {
                        console.error('Error reading email template:', err);
                        return res.status(500).json({ error: 'Error generating email content.' });
                    }
        
                    // Replace placeholders with actual values
                    const updatedHtml = htmlContent
                        .replace('{{USER_NAME}}', deliveries.username)
                        .replace('{{BEAT_NAME}}', deliveries.audio_caption)
                        .replace('{{BEAT_DOWNLOAD_URL}}', audioDownloadUrl)
                        .replace('{{LICENSE_DOWNLOAD_URL}}', licenseDownloadUrl)
                        .replace('{{CURRENT_YEAR}}', new Date().getFullYear())
        
                    // Send OTP via Email with the updated template
                    const mailOptions = {
                        from: process.env.EMAIL_USER,
                        to: email,
                        subject: "Beat Delivery From Zuumusic",
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

                // Update the delivery status to true
                await client.query(`
                    UPDATE audio_purchases
                    SET delivered = true
                    WHERE id = $1`,
                    [deliveries.id]
                );
                console.log(`Beat delivery for purchase ${deliveries.id} has been sent to user ${deliveries.purchaser_id}`);
            }
        }
    } catch (error) {
        console.error('Error checking promotion expirations:', error);
    } finally {
        client.release();
    }
};

// Schedule the job to run every day at midnight (00:00)
const startCronJob = () => {
    cron.schedule('0 0 * * *', () => {
        console.log('Running daily beat purchase checks...');
        checkBeatDelivery();
    }, {
        scheduled: true,
        timezone: 'UTC' // Adjust timezone as needed (e.g., 'Africa/Lagos' for Nigeria)
    });
    console.log('Check cron job scheduled');
};

module.exports = { startCronJob };