const express = require('express');
const { tokenRequired, tokenProfileRequired } = require('../middleware/Auth.middleware')
const { updateProfileValidator, followProfileValidator, virtualAccountValidator } = require('../middleware/User.middleware');
const { transactionHistoryController } = require('../controllers/Payment.controller');
const { getProfile, updateProfile, deleteProfile, followProfile, getProfileById, 
        getRoomId, getChatRooms, RequestDistribution, getDistributionRequests, 
        addUsersToLabel, acceptLabelRequest, getUserLabels, getLabelMembers, mediaPromotion,
        editDistributionRequest,
        getMusicPromotionRequests,
        editMusicPromotion} = require('../controllers/User.controller');
const router = express.Router();

/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Profile]
 *     description: Retrieves the profile information for the authenticated user
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: Profile ID
 *                 image:
 *                   type: string
 *                   description: Profile image URL
 *                 cover_image:
 *                   type: string
 *                   description: Cover image URL
 *                 bio:
 *                   type: string
 *                   description: User biography
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                   description: Profile creation timestamp
 *                 username:
 *                   type: string
 *                   description: User's username
 *                 firstname:
 *                   type: string
 *                   description: User's firstname
 *                 lastname:
 *                   type: string
 *                   description: User's lastname
 *                 middlename:
 *                   type: string
 *                   description: User's middlename
 *                 email:
 *                   type: string
 *                   description: User's email
 *                 phone_number:
 *                   type: string
 *                   description: User's phone number
 *                 identity:
 *                   type: string
 *                   description: User's identity type
 *                 email_verified:
 *                   type: boolean
 *                   description: Whether email is verified
 *                 is_admin:
 *                   type: boolean
 *                   description: Whether user is an admin
 *               example:
 *                 id: 1
 *                 image: "https://example.com/image.jpg"
 *                 cover_image: "https://example.com/cover.jpg"
 *                 bio: "Software developer"
 *                 username: "Myles"
 *                 email: "example@gmail.com"
 *                 phone_number: 08049387362
 *                 identity: "artist"
 *                 email_verified: true
 *                 is_admin: false
 *                 created_at: "2025-03-07T12:00:00Z"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Profile not found
 *       500:
 *         description: Server error
 */
router.get('/profile', tokenProfileRequired, getProfile);


/**
 * @swagger
 * /api/user/profile/{id}:
 *   get:
 *     summary: Get user profile by id
 *     tags: [Profile]
 *     description: Retrieves the profile information for the authenticated user
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user to retrieve notifications for
 *     responses:
 *       200:
 *         description: Successfully retrieved profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: Profile ID
 *                 image:
 *                   type: string
 *                   description: Profile image URL
 *                 cover_image:
 *                   type: string
 *                   description: Cover image URL
 *                 bio:
 *                   type: string
 *                   description: User biography
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                   description: Profile creation timestamp
 *                 username:
 *                   type: string
 *                   description: User's username
 *                 email:
 *                   type: string
 *                   description: User's email
 *                 phone_number:
 *                   type: string
 *                   description: User's phone number
 *                 identity:
 *                   type: string
 *                   description: User's identity type
 *                 email_verified:
 *                   type: boolean
 *                   description: Whether email is verified
 *                 is_admin:
 *                   type: boolean
 *                   description: Whether user is an admin
 *               example:
 *                 id: 1
 *                 image: "https://example.com/image.jpg"
 *                 cover_image: "https://example.com/cover.jpg"
 *                 bio: "Software developer"
 *                 username: "Myles"
 *                 email: "example@gmail.com"
 *                 phone_number: 08049387362
 *                 identity: "artist"
 *                 email_verified: true
 *                 is_admin: false
 *                 created_at: "2025-03-07T12:00:00Z"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Profile not found
 *       500:
 *         description: Server error
 */
router.get('/profile/:id', tokenProfileRequired, getProfileById);


/**
 * @swagger
 * /api/user/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Profile]
 *     description: Updates the authenticated user's profile and user details. Email updates trigger a verification email.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: New username
 *               email:
 *                 type: string
 *                 description: New email (triggers verification)
 *               phone_number:
 *                 type: string
 *                 description: New phone number
 *               bio:
 *                 type: string
 *                 description: New biography
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Profile image file
 *               cover_image:
 *                 type: string
 *                 format: binary
 *                 description: Cover image file
 *           required: [] 
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 emailVerificationSent:
 *                   type: boolean
 *                   description: Indicates if an email verification was sent
 *               example:
 *                 message: "Profile updated successfully"
 *                 emailVerificationSent: true
 *       400:
 *         description: Validation errors
 *       404:
 *         description: Profile not found
 *       500:
 *         description: Server error
 */
router.put('/profile', tokenRequired, ...updateProfileValidator, updateProfile);

/**
 * @swagger
 * /api/user/profile:
 *   delete:
 *     summary: Delete user profile
 *     description: Deletes the authenticated user's profile. Does not affect the user account itself.
 *     tags: [Profile]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Profile deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 message:
 *                   type: string
 *               example:
 *                 status: true
 *                 message: "Profile deleted successfully"
 *       404:
 *         description: Profile not found
 *       500:
 *         description: Server error
 */
router.delete('/profile', tokenRequired, deleteProfile);

/**
 * @swagger
 * /api/user/follow:
 *   post:
 *     summary: Follow or unfollow a user profile
 *     description: Allows an authenticated user to follow or unfollow another user profile.
 *     tags: [Profile]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               profileId:
 *                 type: integer
 *                 description: The ID of the profile to follow or unfollow.
 *                 example: 123
 *               follow:
 *                 type: boolean
 *                 description: Set to true to follow, false to unfollow.
 *                 example: true
 *     responses:
 *       200:
 *         description: Follow action successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *               example:
 *                 message: "Follow action successful"
 *       401:
 *         description: No changes made (already followed/unfollowed)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *               example:
 *                 message: "No changes made"
 *       404:
 *         description: Profile ID does not exist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *               example:
 *                 message: "Profile ID does not exist"
 *       406:
 *         description: User cannot follow themselves
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *               example:
 *                 message: "You cannot follow yourself"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 error:
 *                   type: string
 *               example:
 *                 status: false
 *                 error: "Internal server error"
 */
router.post('/follow', tokenProfileRequired, ...followProfileValidator, followProfile);

/**
 * @swagger
 * /api/user/get-room-id:
 *   post:
 *     summary: Get the room id of the profiles
 *     description: Get the room id of the profiles
 *     tags: [Profile] 
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               profileId_1:
 *                 type: integer
 *                 description: The ID of the profile to follow or unfollow.
 *                 example: 123
 *               profileId_2:
 *                 type: integer
 *                 description: The ID of the profile to follow or unfollow.
 *                 example: 123
 *     responses:
 *       200:
 *         description: Get the room id
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 room_id:
 *                   type: string
 *               example:
 *                 room_id: "123456"
 *       400:
 *         description: Required fields missing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *               example:
 *                 message: "Profile Ids missing"
 *       404:
 *         description: Profile ID does not exist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *               example:
 *                 message: "Profile1 not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 error:
 *                   type: string
 *               example:
 *                 status: false
 *                 error: "Internal server error"
 */
router.post('/get-room-id', getRoomId);


/**
 * @swagger
 * /api/user/get-rooms:
 *   get:
 *     summary: Get the room id of the profiles
 *     description: Get the room id of the profiles
 *     tags: [Profile]
 *     responses:
 *       200:
 *         description: Get rooms
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 room_id:
 *                   type: string
 *                 recipient_id:
 *                   type: string
 *               example:
 *                 room_id: "123456"
 *                 recipient_id: "283"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 error:
 *                   type: string
 *               example:
 *                 status: false
 *                 error: "Internal server error"
 */
router.get('/get-rooms', tokenProfileRequired, getChatRooms);


/**
 * @swagger
 * /api/user/transactions:
 *   get:
 *     summary: Get all transaction history for the authenticated user
 *     description: Returns a list of transactions including promotions, audio sales, and subscriptions
 *     tags: [Transactions]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Successful retrieval of transaction history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       amount:
 *                         type: number
 *                       type:
 *                         type: string
 *                         example: "promotion_audio"
 *                       status:
 *                         type: string
 *                         example: "successful"
 *                       postId:
 *                         type: string
 *                         nullable: true
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 error:
 *                   type: string
 *               example:
 *                 status: false
 *                 error: "Internal server error"
 */
router.get('/transactions', tokenRequired, transactionHistoryController);

/**
 * @swagger
 * /api/user/distribution-request:
 *   post:
 *     summary: Distribution request
 *     description: Apply to have your music distributed
 *     tags: [Distribution] 
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               caption:
 *                 type: string
 *                 example: "Smurkio"
 *               description:
 *                 type: string
 *                 example: "Music displays the art of rapping in the hood"
 *               genre:
 *                 type: string
 *                 example: "Hip hop"
 *               social_links:
 *                 type: json
 *                 description: 'SOcial links required ({"spotify": "https://spotify.com", "apple_music": "https://apple.com", "boomplay": "https://boomplay.com", "audio_mark": "https://audiomack.com"})'
 *                 example: '{"spotify": "https://spotify.com", "apple_music": "https://apple.com", "boomplay": "https://boomplay.com", "audio_mark": "https://audiomack.com"}'
 *               audio_upload:
 *                 type: string
 *                 format: binary
 *               cover_photo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Distribution successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *               example:
 *                 message: "Music Distribution request successful"
 *       400:
 *         description: Required fields missing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *               example:
 *                 message: "Audio upload missing"
 *       406:
 *         description: Invalid time format or Audio or cover photo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *               example:
 *                 message: "Audio file must be in MP3 format"
 *       409:
 *         description: Insufficient funds
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *               example:
 *                 message: "Insufficient funds"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 error:
 *                   type: string
 *               example:
 *                 status: false
 *                 error: "Internal server error"
 */
router.post('/distribution-request', tokenProfileRequired, RequestDistribution);

/**
 * @swagger
 * /api/user/distribution-request/{request_id}:
 *   put:
 *     summary: Distribution request
 *     description: Apply to have your music distributed
 *     tags: [Distribution]
 *     parameters:
 *       - in: path
 *         name: request_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the distribution request to edit
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               caption:
 *                 type: string
 *                 example: "Smurkio"
 *               description:
 *                 type: string
 *                 example: "Music displays the art of rapping in the hood"
 *               genre:
 *                 type: string
 *                 example: "Hip hop"
 *               social_links:
 *                 type: json
 *                 description: 'SOcial links required ({"spotify": "https://spotify.com", "apple_music": "https://apple.com", "boomplay": "https://boomplay.com", "audio_mark": "https://audiomack.com"})'
 *                 example: '{"spotify": "https://spotify.com", "apple_music": "https://apple.com", "boomplay": "https://boomplay.com", "audio_mark": "https://audiomack.com"}'
 *               audio_upload:
 *                 type: string
 *                 format: binary
 *               cover_photo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Music Distribution successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *               example:
 *                 message: "Music Distribution request successful"
 *       400:
 *         description: Required fields missing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *               example:
 *                 message: "Audio upload missing"
 *       406:
 *         description: Invalid time format or Audio or cover photo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *               example:
 *                 message: "Audio file must be in MP3 format"
 *       409:
 *         description: Insufficient funds
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *               example:
 *                 message: "Insufficient funds"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 error:
 *                   type: string
 *               example:
 *                 status: false
 *                 error: "Internal server error"
 */
router.put('/distribution-request/:request_id', tokenProfileRequired, editDistributionRequest);


/**
 * @swagger
 * /api/user/distribution-requests:
 *   get:
 *     summary: Get all distribution requests
 *     tags: [Distribution]
 *     description: Retrieve all distribution requests.
 *     responses:
 *       200:
 *         description: Successfully retrieved distribution requests.
 *       500:
 *         description: Server error.
 */
router.get('/distribution-requests', tokenProfileRequired, getDistributionRequests);

/**
 * @swagger
 * /api/user/musicpromotion-request:
 *   post:
 *     summary: Music promotion request
 *     description: Apply to have your music distributed
 *     tags: [Music Promotion] 
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               caption:
 *                 type: string
 *                 example: "Smurkio"
 *               description:
 *                 type: string
 *                 example: "Music displays the art of rapping in the hood"
 *               genre:
 *                 type: string
 *                 example: "Hip hop"
 *               media_links:
 *                 type: json
 *                 description: 'Media links required ({"tiktok": "https://tiktok.com", "instagram": "https://instagram.com", "x": "https://x.com", "facebook": "https://facebook.com", "youtube": "https://youtube.com"})'
 *                 example: '{"tiktok": "https://tiktok.com", "instagram": "https://instagram.com", "x": "https://x.com", "facebook": "https://facebook.com", "youtube": "https://youtube.com"}'
 *               audio_upload:
 *                 type: string
 *                 format: binary
 *               cover_photo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Music promotion
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *               example:
 *                 message: "Music Promotion request successful"
 *       400:
 *         description: Required fields missing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *               example:
 *                 message: "Audio upload missing"
 *       406:
 *         description: Invalid time format or Audio or cover photo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *               example:
 *                 message: "Audio file must be in MP3 format"
 *       409:
 *         description: Insufficient funds
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *               example:
 *                 message: "Insufficient funds"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 error:
 *                   type: string
 *               example:
 *                 status: false
 *                 error: "Internal server error"
 */
router.post('/musicpromotion-request', tokenProfileRequired, mediaPromotion);

/**
 * @swagger
 * /api/user/musicpromotion-request/{request_id}:
 *   put:
 *     summary: Music promotion request
 *     description: Apply to have your music distributed
 *     tags: [Music promotion]
 *     parameters:
 *       - in: path
 *         name: request_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the music promotion request to edit
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               caption:
 *                 type: string
 *                 example: "Smurkio"
 *               description:
 *                 type: string
 *                 example: "Music displays the art of rapping in the hood"
 *               genre:
 *                 type: string
 *                 example: "Hip hop"
 *               social_links:
 *                 type: json
 *                 description: 'SOcial links required ({"spotify": "https://spotify.com", "apple_music": "https://apple.com", "boomplay": "https://boomplay.com", "audio_mark": "https://audiomack.com"})'
 *                 example: '{"spotify": "https://spotify.com", "apple_music": "https://apple.com", "boomplay": "https://boomplay.com", "audio_mark": "https://audiomack.com"}'
 *               audio_upload:
 *                 type: string
 *                 format: binary
 *               cover_photo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Music promotion
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *               example:
 *                 message: "Music Promotion request successful"
 *       400:
 *         description: Required fields missing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *               example:
 *                 message: "Audio upload missing"
 *       406:
 *         description: Invalid time format or Audio or cover photo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *               example:
 *                 message: "Audio file must be in MP3 format"
 *       409:
 *         description: Insufficient funds
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *               example:
 *                 message: "Insufficient funds"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 error:
 *                   type: string
 *               example:
 *                 status: false
 *                 error: "Internal server error"
 */
router.put('/musicpromotion-request/:request_id', tokenProfileRequired, editMusicPromotion);


/**
 * @swagger
 * /api/user/musicpromotion-requests:
 *   get:
 *     summary: Get all Music promotion requests
 *     tags: [Music promotion]
 *     description: Retrieve all music promotion requests.
 *     responses:
 *       200:
 *         description: Successfully retrieved music promotion requests.
 *       500:
 *         description: Server error.
 */
router.get('/musicpromotion-requests', tokenProfileRequired, getMusicPromotionRequests);


/**
 * @swagger
 * /api/user/label/add-users:
 *   post:
 *     summary: Invite a user to your label
 *     description: |
 *       Invite a user by `member_id` to join the authenticated user's label.
 *       - If no existing record, creates a new pending invitation.
 *       - If status is `ex-member`, re-invites by setting status back to `pending`.
 *       - Returns an error if user does not exist, invitation is already pending, or user is already active.
 *     tags: [Label]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - member_id
 *               - invitation_message
 *             properties:
 *               member_id:
 *                 type: integer
 *                 description: ID of the user to invite
 *                 example: 42
 *               invitation_message:
 *                 type: string
 *                 description: Custom message to include in the invitation email
 *                 example: "Hey, we’d love to have you on our label—please join!"
 *     responses:
 *       200:
 *         description: Invitation created (or re-sent) successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Request sent successfully"
 *       404:
 *         description: Target user does not exist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User does not exist"
 *       406:
 *         description: Invitation already pending or user is already a member
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   enum: ["Pending invitation", "User is already a member"]
 *       500:
 *         description: Error generating email or sending notification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */
router.get('/label/add-users', tokenProfileRequired, addUsersToLabel);
  
  
/**
 * @swagger
 * /api/user/label/members:
 *   get:
 *     summary: Retrieve active label members
 *     description: |
 *       Fetches all active members of the authenticated user's label.
 *       Only users with `record_label` identity may access.
 *     tags: [Label]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of active label members (or empty list if none)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Label members retrieved successfully"
 *                 label_members:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       owner_id:
 *                         type: integer
 *                       member_id:
 *                         type: integer
 *                       invitation_message:
 *                         type: string
 *                       status:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date
 *                       updated_at:
 *                         type: string
 *                         format: date
 *       401:
 *         description: Unauthorized (not a record_label)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */
router.get('/label/members', tokenProfileRequired, getLabelMembers);

/**
 * @swagger
 * /api/user/label/accept-request:
 *   post:
 *     summary: Accept or decline a label invitation
 *     description: |
 *       Allows a user to accept or decline a pending label invitation.
 *       Only pending invitations belonging to the user can be updated.
 *     tags: [Label]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               label_id:
 *                 type: integer
 *                 example: 1
 *               accept:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Invitation accepted or declined successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Label invitation accepted successfully"
 *       404:
 *         description: Invitation not found or unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Label invitation not found or not authorized"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */
router.post('/accept-request', tokenProfileRequired, acceptLabelRequest);

/**
 * @swagger
 * /api/user/label/user-labels:
 *   get:
 *     summary: Retrieve user's active labels
 *     description: |
 *       Fetches all labels where the authenticated user is an active member.
 *     tags: [Label]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of active labels (or empty list if none)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Labels retrieved successfully"
 *                 labels:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       owner_id:
 *                         type: integer
 *                       member_id:
 *                         type: integer
 *                       invitation_message:
 *                         type: string
 *                       status:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */
router.post('/user-labels', tokenProfileRequired, getUserLabels);



module.exports = router;


