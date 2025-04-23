const db = require('../config/db.conf');

const createPostVideoTable = async () => {
    try {
        const client = await db.connect();
        await client.query(`
            CREATE TABLE IF NOT EXISTS post_video (
                id SERIAL PRIMARY KEY,
                profile_id INT NOT NULL,
                caption VARCHAR(255) NOT NULL,
                video_upload VARCHAR(255) NOT NULL,
                public BOOLEAN NOT NULL DEFAULT true,
                location VARCHAR(255) NOT NULL,
                likes INT NOT NULL DEFAULT 0,
                unlikes INT NOT NULL DEFAULT 0,
                comments INT NOT NULL DEFAULT 0,
                shares INT NOT NULL DEFAULT 0,
                promoted BOOLEAN DEFAULT false,
                promotion_duration INT DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

                CONSTRAINT fk_profile FOREIGN KEY (profile_id) 
                REFERENCES profile(id) ON DELETE CASCADE
            )
        `);
        // console.log('✅ Post Video table is ready!');
        client.release();
    } catch (err) {
        console.error('❌ Error creating table:', err);
    }
};

const PostVideoLikesTable = async () => {
    try {
        const client = await db.connect();
        await client.query(`
            CREATE TABLE IF NOT EXISTS post_video_reactions (
                id SERIAL PRIMARY KEY,
                post_id INT NOT NULL,
                post_reacter_id INT NOT NULL,
                "like" BOOLEAN DEFAULT false,
                "unlike" BOOLEAN DEFAULT false,

                CONSTRAINT fk_post FOREIGN KEY (post_id) 
                REFERENCES post_video(id) ON DELETE CASCADE,
                CONSTRAINT fk_reacter FOREIGN KEY (post_reacter_id)
                REFERENCES profile(id) ON DELETE CASCADE
            )
        `);
        // console.log('✅ Post Video Likes table is ready!');
        client.release();
    } catch (err) {
        console.error('❌ Error creating table:', err);
    }
};

const PostVideoCommentsTable = async () => {
    try {
        const client = await db.connect();
        await client.query(`
            CREATE TABLE IF NOT EXISTS post_video_comments (
                id SERIAL PRIMARY KEY,
                post_id INT NOT NULL,
                post_commenter_id INT NOT NULL,
                comment VARCHAR(255) NOT NULL,

                CONSTRAINT fk_post FOREIGN KEY (post_id) 
                REFERENCES post_video(id) ON DELETE CASCADE,
                CONSTRAINT fk_commenter FOREIGN KEY (post_commenter_id) 
                REFERENCES profile(id) ON DELETE CASCADE
            )
        `);
        // console.log('✅ Post Video Comments table is ready!');
        client.release();
    } catch (err) {
        console.error('❌ Error creating table:', err);
    }
};

const PostVideoSharesTable = async () => {
    try {
        const client = await db.connect();
        await client.query(`
            CREATE TABLE IF NOT EXISTS post_video_shares (
                id SERIAL PRIMARY KEY,
                post_id INT NOT NULL,
                post_sharer INT NOT NULL,
                caption VARCHAR(255) NOT NULL,

                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

                CONSTRAINT fk_post FOREIGN KEY (post_id) 
                REFERENCES post_video(id) ON DELETE CASCADE,
                CONSTRAINT fk_sharer FOREIGN KEY (post_sharer_id) 
                REFERENCES profile(id) ON DELETE CASCADE
            )
        `);
        // console.log('✅ Post Video Shares table is ready!');
        client.release();
    } catch (err) {
        console.error('❌ Error creating table:', err);
    }
};

const PostTaggedPeopleTable = async () => {
    try {
        const client = await db.connect();
        await client.query(`
            CREATE TABLE IF NOT EXISTS post_video_tagged_people (
                id SERIAL PRIMARY KEY,
                post_id INT NOT NULL,
                tagged_person_id INT NOT NULL,

                CONSTRAINT fk_post FOREIGN KEY (post_id) 
                REFERENCES post_video(id) ON DELETE CASCADE,
                CONSTRAINT fk_tagged FOREIGN KEY (tagged_person_id) 
                REFERENCES profile(id) ON DELETE CASCADE
            )
        `);
        // console.log('✅ Post Video Tagged People table is ready!');
        client.release();
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
