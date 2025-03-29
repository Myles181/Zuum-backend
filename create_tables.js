const { createUserTable, createOtpTable } = require('./models/User.model.js');
const { createProfileTable } = require('./models/Profile.model.js');
const { createFollowTable } = require('./models/Followers.model.js');
const { createAccountTable } = require('./models/Account.model.js');
const { createPaymentTables } = require('./models/Payment.model.js');
const { createMessageTable, createRoomsTable } = require('./models/Chat.model.js');
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

const { createNotificationTable } = require('./models/Notification.model.js') // import notification table


// This function creates all tables and it should be ran before starting the server 
const create_db_tables = async () => {
    await createUserTable();
    await createOtpTable();
    await createProfileTable();
    await createFollowTable();
    await createPostAudioTable();
    await createAccountTable();
    await createPostAudioCommentsTable();
    await createPostAudioLikesTable();
    await createPostAudioSharesTable();
    await createPostVideoTable();
    await PostVideoCommentsTable();
    await PostTaggedPeopleTable();
    await PostVideoLikesTable();
    await PostVideoSharesTable();
    await createNotificationTable();
    await createMessageTable();
    await createRoomsTable();
    await createPaymentTables();

    return
}

module.exports = {create_db_tables};
