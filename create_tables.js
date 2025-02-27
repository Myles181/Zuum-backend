const { createUserTable } = require('./models/User.model.js');
const { createProfileTable } = require('./models/Profile.model.js');
const { createFollowTable } = require('./models/Followers.model.js');
const {
    createPostAudioTable, 
    PostAudioCommentsTable,
    PostAudioSharesTable, 
    PostAudioLikesTable } = require('./models/PostAudio.model.js');

const {
    createPostVideoTable,
    PostVideoCommentsTable,
    PostTaggedPeopleTable,
    PostVideoLikesTable,
    PostVideoSharesTable,
} = require('./models/PostVideo.model.js');


// This function creates all tables and it should be ran before starting the server 
const create_db_tables = async () => {
    createUserTable();
    createProfileTable();
    createFollowTable();
    createPostAudioTable();
    PostAudioCommentsTable();
    PostAudioSharesTable();
    PostAudioLikesTable();
    createPostVideoTable();
    PostVideoCommentsTable();
    PostTaggedPeopleTable();
    PostVideoLikesTable();
    PostVideoSharesTable();

    return
}

module.exports = {create_db_tables};
