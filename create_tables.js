const { createUserTable, createOtpTable } = require('./models/User.model.js');
const { createProfileTable } = require('./models/Profile.model.js');
const { createFollowTable } = require('./models/Followers.model.js');
const {
    createPostAudioTable, 
    createPostAudioCommentsTable,
    createPostAudioLikesTable, 
    createPostAudioSharesTable } = require('./models/PostAudio.model.js');

const {
    createPostVideoTable,
    PostVideoCommentsTable,
    PostTaggedPeopleTable,
    PostVideoLikesTable,
    PostVideoSharesTable,
} = require('./models/PostVideo.model.js');


// This function creates all tables and it should be ran before starting the server 
const create_db_tables = async () => {
    await createUserTable();
    await createOtpTable();
    await createProfileTable();
    await createFollowTable();
    await createPostAudioTable();
    await createPostAudioCommentsTable();
    await createPostAudioLikesTable();
    await createPostAudioSharesTable();
    await createPostVideoTable();
    await PostVideoCommentsTable();
    await PostTaggedPeopleTable();
    await PostVideoLikesTable();
    await PostVideoSharesTable();

    return
}

module.exports = {create_db_tables};
