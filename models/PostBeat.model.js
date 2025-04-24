const db = require('../config/db.conf');

const createPostAudioForSaleTable = async () => {
    try {
        const client = await db.connect();
        await client.query(`
            CREATE TABLE IF NOT EXISTS post_audio_sell (
                id SERIAL PRIMARY KEY,
                profile_id INT NOT NULL,
                caption VARCHAR(255) NOT NULL,
                description VARCHAR(255),
                genre VARCHAR(255),
                cover_photo VARCHAR(255) NOT NULL,
                audio_upload VARCHAR(255) NOT NULL,
                amount INT NOT NULL,
                total_supply INT DEFAULT 1,
                total_buyers INT DEFAULT 0,

                promoted BOOLEAN DEFAULT false,
                promotion_duration INT DEFAULT 0,

                likes INT NOT NULL DEFAULT 0,
                unlikes INT NOT NULL DEFAULT 0,
                comments INT NOT NULL DEFAULT 0,

                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

                CONSTRAINT fk_profile FOREIGN KEY (profile_id) 
                REFERENCES profile(id) ON DELETE CASCADE
            )
        `);
        // console.log('✅ Post Beat table is ready!');
        client.release();
    } catch (err) {
        console.error('❌ Error creating table:', err);
    }
};

const createPostBeatLikesTable = async () => {
    try {
        const client = await db.connect();
        await client.query(`
            CREATE TABLE IF NOT EXISTS post_beat_reactions (
                id SERIAL PRIMARY KEY,
                post_id INT NOT NULL,
                post_reacter_id INT NOT NULL,
                "like" BOOLEAN DEFAULT false,
                "unlike" BOOLEAN DEFAULT false,

                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

                CONSTRAINT fk_post FOREIGN KEY (post_id)
                REFERENCES post_audio_sell(id) ON DELETE CASCADE,
                CONSTRAINT fk_reacter FOREIGN KEY (post_reacter_id)
                REFERENCES profile(id) ON DELETE CASCADE
            )
        `);
        // console.log('✅ Post Audio Likes table is ready!');
        client.release();
    } catch (err) {
        console.error('❌ Error creating table:', err);
    }
};

const createPostBeatCommentsTable = async () => {
    try {
        const client = await db.connect();
        await client.query(`
            CREATE TABLE IF NOT EXISTS post_beat_comments (
                id SERIAL PRIMARY KEY,
                post_id INT NOT NULL,
                post_commenter_id INT NOT NULL,
                comment VARCHAR(255) NOT NULL,

                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

                CONSTRAINT fk_post FOREIGN KEY (post_id) 
                REFERENCES post_audio_sell(id) ON DELETE CASCADE,
                CONSTRAINT fk_commenter FOREIGN KEY (post_commenter_id) 
                REFERENCES profile(id) ON DELETE CASCADE
            )
        `);
        // console.log('✅ Post Audio Comments table is ready!');
        client.release();
    } catch (err) {
        console.error('❌ Error creating table:', err);
    }
};

const AudioPurchasesTable = async () => {
    try {
        const client = await db.connect();
        await client.query(`
            CREATE TABLE IF NOT EXISTS audio_purchases (
                id SERIAL PRIMARY KEY,
                profile_id INT NOT NULL,
                post_id INT NOT NULL,
                audio_upload VARCHAR(255) NOT NULL,
                amount_paid INT NOT NULL,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

                CONSTRAINT fk_profile FOREIGN KEY (profile_id) 
                REFERENCES profile(id) ON DELETE CASCADE
            )
        `);
        // console.log('✅ Post Beat table is ready!');
        client.release();
    } catch (err) {
        console.error('❌ Error creating table:', err);
    }
};



// Promotion Plans create  (amount, name, duration, description)
// Once payment is confirmed, tag the post as promoted = true. ADD to the Post (promoted=true, promoted_transaction_id=FOREIGN_KEY(promotion))
// Linked to a promotion table (duration, amount, post_id, createdAt)

// Run this function before starting the server

module.exports = {
    createPostAudioForSaleTable,
    createPostBeatCommentsTable,
    createPostBeatLikesTable,
    AudioPurchasesTable
};
