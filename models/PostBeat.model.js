const db = require('../config/db.conf');

const createPostBeatTable = async () => {
    try {
        const client = await db.connect();
        await client.query(`
            CREATE TABLE IF NOT EXISTS post_beat (
                id SERIAL PRIMARY KEY,
                profile_id INT NOT NULL,
                caption VARCHAR(255) NOT NULL,
                cover_photo VARCHAR(255) NOT NULL,
                likes INT NOT NULL DEFAULT 0,
                unlikes INT NOT NULL DEFAULT 0,
                comments INT NOT NULL DEFAULT 0,

                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

                bank_name VARCHAR(255) NOT NULL,
                bank_account INT NOT NULL,
                account_name VARCHAR(255) NOT NULL,
                amount INT NOT NULL,

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
                REFERENCES post_audio(id) ON DELETE CASCADE,
                CONSTRAINT fk_reacter FOREIGN KEY (post_reacter)
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
                REFERENCES post_audio(id) ON DELETE CASCADE,
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

const BeatPaymentReferenceTable = async () => {
    try {
        const client = await db.connect();
        await client.query(`
            CREATE TABLE IF NOT EXISTS post_beat (
                id SERIAL PRIMARY KEY,
                profile_id INT NOT NULL,
                post_id INT NOT NULL,
                reference VARCHAR(255) NOT NULL,
                status VARCHAR(255) NOT NULL DEFAULT 'pending',

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

// Run this function before starting the server
// createPostBeatTable();

module.exports = {
    BeatPaymentReferenceTable,
    createPostBeatCommentsTable,
    createPostBeatLikesTable,
    createPostBeatTable
}

module.exports = db;
