const db = require('../config/db.conf');

const createPostVideoTable = async () => {
    try {
        const connection = await db.getConnection();
        await connection.query(`CREATE TABLE IF NOT EXISTS post_video (
            id INT AUTO_INCREMENT PRIMARY KEY,
            profile_id INT NOT NULL,
            caption VARCHAR(255) NOT NULL,
            video_url VARCHAR(255) NOT NULL,
            public BOOLEAN NOT NULL DEFAULT true,
            location VARCHAR(255) NOT NULL,
            likes INT NOT NULL DEFAULT 0,
            comments INT NOT NULL DEFAULT 0,
            shares INT NOT NULL DEFAULT 0,


            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

            FOREIGN KEY (profile_id) REFERENCES profile(id) ON DELETE CASCADE
        )`);
        console.log('✅ Follow table is ready!');
        connection.release();
    } catch (err) {
        console.error('❌ Error creating table:', err);
    }
};

const PostVideoLikesTable = async () => {
    try {
        const connection = await db.getConnection();
        await connection.query(`CREATE TABLE IF NOT EXISTS post_video_likes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            post_id INT NOT NULL,
            post_liker INT NOT NULL,


            FOREIGN KEY (post_id) REFERENCES post_video(id) ON DELETE CASCADE,
            FOREIGN KEY (post_liker) REFERENCES profile(id) ON DELETE CASCADE
        )`);
        console.log('✅ Post Audio Likes table is ready!');
        connection.release();
    } catch (err) {
        console.error('❌ Error creating table:', err);
    }
};

const PostVideoCommentsTable = async () => {
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

const PostVideoSharesTable = async () => {
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
const PostTaggedPeopleTable = async () => {
    try {
        const connection = await db.getConnection();
        await connection.query(`CREATE TABLE IF NOT EXISTS post_video_tagged_people (
            id INT AUTO_INCREMENT PRIMARY KEY,
            post_id INT NOT NULL,
            tagged_person INT NOT NULL,


            FOREIGN KEY (post_id) REFERENCES post_video(id) ON DELETE CASCADE,
            FOREIGN KEY (tagged_person) REFERENCES profile(id) ON DELETE CASCADE
        )`);
        console.log('✅ Post Audio Likes table is ready!');
        connection.release();
    } catch (err) {
        console.error('❌ Error creating table:', err);
    }
};


module.exports = {
    createPostVideoTable, 
    PostVideoLikesTable, 
    PostVideoCommentsTable,
    PostVideoSharesTable,
    PostTaggedPeopleTable
};
