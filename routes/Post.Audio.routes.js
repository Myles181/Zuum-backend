const express = require('express');
const { tokenProfileRequired } = require('../middleware/Auth.middleware')
const { createPostAudioValidator, deletePostAudioValidator, deleteCommentOnAudioPostValidator,
        reactToAudioPostValidator, commentToAudioPostValidator, updateCommentOnAudioPostValidator,
        updatePostAudioValidator } = require('../middleware/Post.middleware');
const { createAudioPost, updateAudioPost, deleteAudioPost, deleteCommentOnAudioPost,
        reactToAudioPost, commentToAudioPost, updateCommentOnAudioPost, getAudioPosts, getAudioPostById } = require('../controllers/Post.Audio.controller');
const router = express.Router();


/**
 * @swagger
 * /api/audio/create:
 *   post:
 *     summary: Create a new audio post
 *     description: Allows a user to upload an audio post with a cover photo and metadata.
 *     tags:
 *       - Audio Posts
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               caption:
 *                 type: string
 *               type:
 *                 type: string
 *                 description: Can either be music/beat
 *               boomplay:
 *                 type: string
 *               apple_music:
 *                 type: string
 *               spotify:
 *                 type: string
 *               audiomark:
 *                 type: string
 *               youtube_music:
 *                 type: string
 *               cover_photo:
 *                 type: string
 *                 format: binary
 *                 description: Cover image file
 *               audio_upload:
 *                 type: string
 *                 format: binary
 *                 description: Audio file
 *     responses:
 *       201:
 *         description: Audio post created successfully
 *       400:
 *         description: Validation error or missing files
 *       500:
 *         description: Server error
 */
router.post('/create', tokenProfileRequired, ...createPostAudioValidator, createAudioPost);

/**
 * @swagger
 * /api/audio/update:
 *   put:
 *     summary: Update an existing audio post
 *     description: Allows a user to update details of their audio post.
 *     tags:
 *       - Audio Posts
 *     security:
 *       - bearerAuth: []
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
 *               type:
 *                 type: string
 *                 description: Can either be music/beat
 *               boomplay:
 *                 type: string
 *               apple_music:
 *                 type: string
 *               spotify:
 *                 type: string
 *               audiomark:
 *                 type: string
 *               youtube_music:
 *                 type: string
 *               cover_photo:
 *                 type: string
 *                 format: binary
 *                 description: Cover image file
 *               audio_upload:
 *                 type: string
 *                 format: binary
 *                 description: Audio file
 *     responses:
 *       200:
 *         description: Audio post updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Post not found or unauthorized
 *       500:
 *         description: Server error
 */
router.put('/update', tokenProfileRequired, ...updatePostAudioValidator, updateAudioPost);

/**
 * @swagger
 * /api/audio/del:
 *   delete:
 *     summary: Delete an audio post
 *     description: Allows a user to delete their audio post.
 *     tags:
 *       - Audio Posts
 *     security:
 *       - bearerAuth: []
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
router.delete('/del', tokenProfileRequired, ...deletePostAudioValidator, deleteAudioPost);

/**
 * @swagger
 * /api/audio/react:
 *   post:
 *     summary: React to an audio post
 *     description: Allows a user to like or unlike an audio post.
 *     tags:
 *       - Audio Posts
 *     security:
 *       - bearerAuth: []
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
router.post('/react', tokenProfileRequired, ...reactToAudioPostValidator, reactToAudioPost);

/**
 * @swagger
 * /api/audio/comment/create:
 *   post:
 *     summary: Comment on an audio post
 *     description: Allows a user to add a comment on an audio post.
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
router.post('/comment/create', tokenProfileRequired, ...commentToAudioPostValidator, commentToAudioPost);

/**
 * @swagger
 * /api/audio/comment/update:
 *   put:
 *     summary: Update a comment on an audio post
 *     description: Allows a user to edit their comment on an audio post.
 *     tags:
 *       - Audio Posts
 *     security:
 *       - bearerAuth: []
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
router.put('/comment/update', tokenProfileRequired, ...updateCommentOnAudioPostValidator, updateCommentOnAudioPost);

// /**
//  * @swagger
//  * /api/audio/user:
//  *   get:
//  *     summary: Get all audio posts for the authenticated user
//  *     description: Fetches all audio posts created by the authenticated user.
//  *     tags:
//  *       - Audio Posts
//  *     security:
//  *       - BearerAuth: []
//  *     responses:
//  *       200:
//  *         description: Successfully retrieved audio posts
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 status:
//  *                   type: boolean
//  *                 message:
//  *                   type: string
//  *                 posts:
//  *                   type: array
//  *                   items:
//  *                     type: object
//  *       500:
//  *         description: Internal Server Error
//  */
// router.get('/user', tokenProfileRequired, getUserAudioPosts);

/**
 * @swagger
 * /api/audio/{postId}:
 *   get:
 *     summary: Get a specific audio post with all associated data
 *     description: Retrieves a specific audio post along with its comments, reactions, and shares.
 *     tags:
 *       - Audio Posts
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the audio post
 *     responses:
 *       200:
 *         description: Successfully retrieved the audio post with details
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
 *         description: Audio post not found
 *       500:
 *         description: Internal Server Error
 */
router.get('/:postId', tokenProfileRequired, getAudioPostById);

/**
 * @swagger
 * /api/audio:
 *   get:
 *     summary: Get all audio posts with pagination
 *     description: Retrieves all audio posts with pagination support.
 *     tags:
 *       - Audio Posts
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
 *         description: Successfully retrieved audio posts
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
router.get('', tokenProfileRequired, getAudioPosts);



module.exports = router;
