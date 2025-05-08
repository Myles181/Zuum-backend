const express = require('express');
const { tokenProfileRequired } = require('../middleware/Auth.middleware')
const { createPostVideoValidator, updatePostVideoValidator, deletePostVideoValidator, reactToVideoPostValidator, commentToVideoPostValidator, 
    updateCommentOnVideoPostValidator, deleteCommentOnVideoPostValidator, shareVideoPostValidator, updateSharedVideoPostValidator, deleteSharedVideoPostValidator } = require('../middleware/Post.Video.middleware');
const { createVideoPost, updateVideoPost, deleteVideoPost, deleteCommentOnVideoPost,
        reactToVideoPost, commentToVideoPost, updateCommentOnVideoPost, getVideoPosts, getVideoPostById, getUserVideoPosts,
        deleteSharedVideoPost, updateSharedVideoPost } = require('../controllers/Post.Video.controller');
const { shareAudioPost } = require('../controllers/Post.Audio.controller');
const router = express.Router();

// console.log("tokenProfileRequired:", tokenProfileRequired);
// console.log("createPostVideoValidator:", createPostVideoValidator);
// console.log("createVideoPost:", createVideoPost);

/**
 * @swagger
 * /api/video/create:
 *   post:
 *     summary: Create a new video post
 *     description: Allows a user to upload an video post with a cover photo and metadata.
 *     tags:
 *       - Video Posts
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               caption:
 *                 type: string
 *               location:
 *                 type: string
 *                 description: Location we use to promote
 *               public:
 *                 type: boolean
 *                 description: Check if it should be true/false
 *               tagged_people:
 *                 type: array
 *                 description: People tagged to the post
 *               video_upload:
 *                 type: string
 *                 format: binary
 *                 description: Video file
 *     responses:
 *       201:
 *         description: Video post created successfully
 *       400:
 *         description: Validation error or missing files
 *       500:
 *         description: Server error
 */
router.post('/create', tokenProfileRequired, ...createPostVideoValidator, createVideoPost);

/**
 * @swagger
 * /api/video/update:
 *   put:
 *     summary: Update an existing video post
 *     description: Allows a user to update details of their video post.
 *     tags:
 *       - Video Posts
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               post_id:
 *                 type: string
 *                 description: The Id of the Post
 *               caption:
 *                 type: string
 *               location:
 *                 type: string
 *               public:
 *                 type: boolean
 *               tagged_people:
 *                 type: array
 *               video_upload:
 *                 type: string
 *                 format: binary
 *                 description: Video file
 *     responses:
 *       200:
 *         description: Video post updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Post not found or unauthorized
 *       500:
 *         description: Server error
 */
router.put('/update', tokenProfileRequired, ...updatePostVideoValidator, updateVideoPost);

/**
 * @swagger
 * /api/video/del:
 *   delete:
 *     summary: Delete an video post
 *     description: Allows a user to delete their video post.
 *     tags:
 *       - Video Posts
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               post_id:
 *                 type: string
 *                 description: The Id of the Post
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Post not found or unauthorized
 *       500:
 *         description: Server error
 */
router.delete('/del', tokenProfileRequired, ...deletePostVideoValidator, deleteVideoPost);

/**
 * @swagger
 * /api/video/react:
 *   post:
 *     summary: React to an video post
 *     description: Allows a user to like or unlike an video post.
 *     tags:
 *       - Video Posts
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               post_id:
 *                 type: string
 *                 description: The Id of the Post
 *               like:
 *                 type: boolean
 *               unlike:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Reaction added successfully
 *       200:
 *         description: Reaction updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Post not found
 *       500:
 *         description: Server error
 */
router.post('/react', tokenProfileRequired, ...reactToVideoPostValidator, reactToVideoPost);


/**
 * @swagger
 * /api/video/comment/create:
 *   post:
 *     summary: Comment on an video post
 *     description: Allows a user to add a comment on an video post.
 *     tags:
 *       - Video Posts
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               post_id:
 *                 type: string
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment added successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Post not found
 *       500:
 *         description: Server error
 */
router.post('/comment/create', tokenProfileRequired, ...commentToVideoPostValidator, commentToVideoPost);

/**
 * @swagger
 * /api/video/comment/update:
 *   put:
 *     summary: Update a comment on an video post
 *     description: Allows a user to edit their comment on an video post.
 *     tags:
 *       - Video Posts
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comment_id:
 *                 type: string
 *                 description: The Id of the Comment
 *               new_comment:
 *                 type: string
 *                 description: The New comment the user edited it to
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Comment not found or unauthorized
 *       500:
 *         description: Server error
 */
router.put('/comment/update', tokenProfileRequired, ...updateCommentOnVideoPostValidator, updateCommentOnVideoPost);

/**
 * @swagger
 * /api/video/comment/del:
 *   delete:
 *     summary: Delete a comment on video post
 *     description: Allows a user to delete their video post.
 *     tags:
 *       - Video Posts
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comment_id:
 *                 type: string
 *                 description: The Id of the Post
 *     responses:
 *       200:
 *         description: Commented deleted successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Commented not found or unauthorized
 *       500:
 *         description: Server error
 */
router.delete('/comment/del', tokenProfileRequired, ...deleteCommentOnVideoPostValidator, deleteCommentOnVideoPost);


/**
 * @swagger
 * /api/video/user:
 *   get:
 *     summary: Get all video posts for the authenticated user
 *     description: Fetches all video posts created by the authenticated user.
 *     tags:
 *       - Video Posts
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved video posts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 posts:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Internal Server Error
 */
router.get('/user', tokenProfileRequired, getUserVideoPosts);

/**
 * @swagger
 * /api/video/{postId}:
 *   get:
 *     summary: Get a specific video post with all associated data
 *     description: Retrieves a specific video post along with its comments, reactions, and shares.
 *     tags:
 *       - Video Posts
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the video post
 *     responses:
 *       200:
 *         description: Successfully retrieved the video post with details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 post:
 *                   type: object
 *       404:
 *         description: Video post not found
 *       500:
 *         description: Internal Server Error
 */
router.get('/:postId', tokenProfileRequired, getVideoPostById);

/**
 * @swagger
 * /api/video:
 *   get:
 *     summary: Get all video posts with pagination
 *     description: Retrieves all video posts with pagination support.
 *     tags:
 *       - Video Posts
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: The page number (default is 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of posts per page (default is 10)
 *     responses:
 *       200:
 *         description: Successfully retrieved video posts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 posts:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     currentPage:
 *                       type: integer
 *                     hasNext:
 *                       type: boolean
 *                     hasPrev:
 *                       type: boolean
 *       500:
 *         description: Internal Server Error
 */
router.get('', tokenProfileRequired, getVideoPosts);


/**
 * @swagger
 * /api/video/share/create:
 *   post:
 *     summary: Share an audio post
 *     description: Allows a user to share an audio post.
 *     tags:
 *       - Audio Posts
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               post_id:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Share successful
 *       400:
 *         description: Validation error
 *       404:
 *         description: Post not found
 *       500:
 *         description: Server error
 */
router.post('/share/create', tokenProfileRequired, ...shareVideoPostValidator, shareAudioPost);

/**
 * @swagger
 * /api/video/share/update:
 *   put:
 *     summary: Update a shared audio post
 *     description: Allows a user to edit their shared audio post.
 *     tags:
 *       - Audio Posts
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               share_id:
 *                 type: string
 *                 description: The Id of the SharedPost
 *               content:
 *                 type: string
 *                 description: The New content the user edited it to
 *     responses:
 *       200:
 *         description: Share successful
 *       400:
 *         description: Validation error
 *       404:
 *         description: Shared Post not found or unauthorized
 *       500:
 *         description: Server error
 */
router.put('/share/update', tokenProfileRequired, ...updateSharedVideoPostValidator, updateSharedVideoPost);


/**
 * @swagger
 * /api/video/share/del:
 *   delete:
 *     summary: Delete a shared video post
 *     description: Allows a user to delete their video post.
 *     tags:
 *       - Audio Posts
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               share_id:
 *                 type: string
 *                 description: The Id of the Post
 *     responses:
 *       200:
 *         description: Share POst deleted successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Shared Post not found or unauthorized
 *       500:
 *         description: Server error
 */
router.delete('/share/del', tokenProfileRequired, ...deleteSharedVideoPostValidator, deleteSharedVideoPost);




module.exports = router;