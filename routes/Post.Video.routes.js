const express = require('express');
const { tokenProfileRequired } = require('../middleware/Post.Video.middleware')
const { createPostVideoValidator, updatePostVideoValidator, deletePostVideoValidator } = require('../middleware/Post.Video.middleware');
const { createVideoPost, updateVideoPost, deleteVideoPost, deleteCommentOnVideoPost,
        reactToVideoPost, commentToVideoPost, updateCommentOnVideoPost, getVideoPosts, getVideoPostById } = require('../controllers/Post.Video.controller');
const router = express.Router();


/**
 * @swagger
 * /api/video/create:
 *   post:
 *     summary: Create a new video post
 *     description: Allows a user to upload an video post with a cover photo and metadata.
 *     tags:
 *       - Video Posts
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
router.post('/react', tokenProfileRequired, ...reactToVideoPostValidator, reactToVideoPost);
