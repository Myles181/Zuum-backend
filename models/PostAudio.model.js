const db = require('../config/db.conf');

const createPostAudioTable = async () => {
    try {
        const client = await db.connect();
        await client.query(`
            CREATE TABLE IF NOT EXISTS post_audio (
                id SERIAL PRIMARY KEY,
                profile_id INT NOT NULL,
                caption VARCHAR(255) NOT NULL,
                type VARCHAR(6) NOT NULL DEFAULT 'music',
                audio_upload VARCHAR(255) NOT NULL,
                cover_photo VARCHAR(255) NOT NULL,
                apple_music VARCHAR(255),
                spotify VARCHAR(255),
                audiomark VARCHAR(255),
                youtube_music VARCHAR(255),
                boomplay VARCHAR(255),
                likes INT NOT NULL DEFAULT 0,
                unlikes INT NOT NULL DEFAULT 0,
                comments INT NOT NULL DEFAULT 0,
                shares INT NOT NULL DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

                CONSTRAINT fk_profile FOREIGN KEY (profile_id) 
                REFERENCES profile(id) ON DELETE CASCADE
            )
        `);
        // console.log('✅ Post Audio table is ready!');
        client.release();
    } catch (err) {
        console.error('❌ Error creating table:', err);
    }
};

const createPostAudioLikesTable = async () => {
    try {
        const client = await db.connect();
        await client.query(`
            CREATE TABLE IF NOT EXISTS post_audio_reactions (
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

const createPostAudioCommentsTable = async () => {
    try {
        const client = await db.connect();
        await client.query(`
            CREATE TABLE IF NOT EXISTS post_audio_comments (
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

const createPostAudioSharesTable = async () => {
    try {
        const client = await db.connect();
        await client.query(`
            CREATE TABLE IF NOT EXISTS post_audio_share (
                id SERIAL PRIMARY KEY,
                post_id INT NOT NULL,
                post_sharer_id INT NOT NULL,
                caption VARCHAR(255) NOT NULL,

                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

                CONSTRAINT fk_post FOREIGN KEY (post_id) 
                REFERENCES post_audio(id) ON DELETE CASCADE,
                CONSTRAINT fk_sharer FOREIGN KEY (post_sharer_id) 
                REFERENCES profile(id) ON DELETE CASCADE
            )
        `);
        // console.log('✅ Post Audio Share table is ready!');
        client.release();
    } catch (err) {
        console.error('❌ Error creating table:', err);
    }
};

module.exports = {
    createPostAudioTable, 
    createPostAudioLikesTable, 
    createPostAudioCommentsTable,
    createPostAudioSharesTable
};
