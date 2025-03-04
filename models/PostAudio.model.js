const db = require('../config/db.conf');

const createPostAudioTable = async () => {
    try {
        const connection = await db.getConnection();
        await connection.query(`CREATE TABLE IF NOT EXISTS post_audio (
            id INT AUTO_INCREMENT PRIMARY KEY,
            profile_id INT NOT NULL,
            caption VARCHAR(255) NOT NULL,
            type VARCHAR(6) NOT NULL DEFAULT 'music',
            audio_url VARCHAR(255) NOT NULL,
            cover_photo VARCHAR(255) NOT NULL,
            apple_music VARCHAR(255),
            spotify VARCHAR(255),
            audiomark VARCHAR(255),
            boomplay VARCHAR(255),
            likes INT NOT NULL DEFAULT 0,
            comments INT NOT NULL DEFAULT 0,
            shares INT NOT NULL DEFAULT 0,


            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (profile_id) REFERENCES profile(id) ON DELETE CASCADE
        )`);
        console.log('✅ Follow table is ready!');
        connection.release();
    } catch (err) {
        console.error('❌ Error creating table:', err);
    }
};

const PostAudioLikesTable = async () => {
    try {
        const connection = await db.getConnection();
        await connection.query(`CREATE TABLE IF NOT EXISTS post_audio_likes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            post_id INT NOT NULL,
            post_liker INT NOT NULL,


            FOREIGN KEY (post_id) REFERENCES post_audio(id) ON DELETE CASCADE,
            FOREIGN KEY (post_liker) REFERENCES profile(id) ON DELETE CASCADE
        )`);
        console.log('✅ Post Audio Likes table is ready!');
        connection.release();
    } catch (err) {
        console.error('❌ Error creating table:', err);
    }
};

const PostAudioCommentsTable = async () => {
    try {
        const connection = await db.getConnection();
        await connection.query(`CREATE TABLE IF NOT EXISTS post_audio_comments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            post_id INT NOT NULL,
            post_commenter INT NOT NULL,
            comment VARCHAR(255) NOT NULL,


            FOREIGN KEY (post_id) REFERENCES post_audio(id) ON DELETE CASCADE,
            FOREIGN KEY (post_commenter) REFERENCES profile(id) ON DELETE CASCADE
        )`);
        console.log('✅ Post Audio Likes table is ready!');
        connection.release();
    } catch (err) {
        console.error('❌ Error creating table:', err);
    }
};

const PostAudioSharesTable = async () => {
    try {
        const connection = await db.getConnection();
        await connection.query(`CREATE TABLE IF NOT EXISTS post_audio_share (
            id INT AUTO_INCREMENT PRIMARY KEY,
            post_id INT NOT NULL,
            post_sharer INT NOT NULL,
            caption VARCHAR(255) NOT NULL,


            FOREIGN KEY (post_id) REFERENCES post_audio(id) ON DELETE CASCADE,
            FOREIGN KEY (post_sharer) REFERENCES profile(id) ON DELETE CASCADE
        )`);
        console.log('✅ Post Audio Share table is ready!');
        connection.release();
    } catch (err) {
        console.error('❌ Error creating table:', err);
    }
};

module.exports = {
    createPostAudioTable, 
    PostAudioLikesTable, 
    PostAudioCommentsTable,
    PostAudioSharesTable
};
