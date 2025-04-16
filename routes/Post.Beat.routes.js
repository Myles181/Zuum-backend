const express = require('express');
const { createBeatPost,
    updateBeatPost,
    deleteBeatPost,
    reactToBeatPost,
    commentToBeatPost,
    updateCommentOnBeatPost,
    deleteCommentOnBeatPost,
    purchaseBeatPost,
    getUserBeatPosts,
    getBeatPostById,
    getBeatPosts
 } = require('../controllers/Post.Beat.controller');

const { tokenProfileRequired, producerTokenRequired } = require('../middleware/Auth.middleware');
const router = express.Router();

/**
 * @swagger
 * /api/beat/create:
 *   post:
 *     summary: Create a new beat post
 *     tags: [Beat]
 *     description: Allows a user to create a new beat post with audio and cover photo uploads.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               caption:
 *                 type: string
 *               description:
 *                 type: string
 *               total_supply:
 *                 type: integer
 *               amount:
 *                 type: number
 *               cover_photo:
 *                 type: string
 *                 format: binary
 *               audio_upload:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Beat post created successfully.
 *       400:
 *         description: Validation errors or missing files.
 *       500:
 *         description: Server error.
 */
router.post('/create', producerTokenRequired, createBeatPost);

/**
 * @swagger
 * /api/beat/update:
 *   put:
 *     summary: Update an existing beat post
 *     tags: [Beat]
 *     description: Allows a user to update details of an existing beat post.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               post_id:
 *                 type: integer
 *               caption:
 *                 type: string
 *               description:
 *                 type: string
 *               total_supply:
 *                 type: integer
 *               amount:
 *                 type: number
 *               cover_photo:
 *                 type: string
 *                 format: binary
 *               audio_upload:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Beat post updated successfully.
 *       400:
 *         description: Validation errors or unauthorized access.
 *       404:
 *         description: Post not found.
 *       500:
 *         description: Server error.
 */
router.put('/update', producerTokenRequired, updateBeatPost);

/**
 * @swagger
 * /api/beat/delete:
 *   delete:
 *     summary: Delete a beat post
 *     tags: [Beat]
 *     description: Allows a user to delete an existing beat post.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               post_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Beat post deleted successfully.
 *       400:
 *         description: Validation errors or unauthorized access.
 *       404:
 *         description: Post not found.
 *       500:
 *         description: Server error.
 */
router.delete('/delete', producerTokenRequired, deleteBeatPost);

/**
 * @swagger
 * /api/beat/react:
 *   post:
 *     summary: React to a beat post
 *     tags: [Beat]
 *     description: Allows a user to like or unlike a beat post.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               post_id:
 *                 type: integer
 *               like:
 *                 type: boolean
 *               unlike:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Reaction updated successfully.
 *       201:
 *         description: Reaction added successfully.
 *       400:
 *         description: Validation errors or invalid reaction.
 *       404:
 *         description: Post not found.
 *       500:
 *         description: Server error.
 */
router.post('/react', tokenProfileRequired, reactToBeatPost);

/**
 * @swagger
 * /api/beat/comment:
 *   post:
 *     summary: Comment on a beat post
 *     tags: [Beat]
 *     description: Allows a user to add a comment to a beat post.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               post_id:
 *                 type: integer
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment added successfully.
 *       400:
 *         description: Validation errors.
 *       404:
 *         description: Post not found.
 *       500:
 *         description: Server error.
 */
router.post('/comment', tokenProfileRequired, commentToBeatPost);

/**
 * @swagger
 * /api/beat/comment/update:
 *   put:
 *     summary: Update a comment on a beat post
 *     tags: [Beat]
 *     description: Allows a user to update their comment on a beat post.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comment_id:
 *                 type: integer
 *               new_comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Comment updated successfully.
 *       400:
 *         description: Validation errors or unauthorized access.
 *       404:
 *         description: Comment not found.
 *       500:
 *         description: Server error.
 */
router.put('/comment/update', tokenProfileRequired, updateCommentOnBeatPost);

/**
 * @swagger
 * /api/beat/comment/delete:
 *   delete:
 *     summary: Delete a comment on a beat post
 *     tags: [Beat]
 *     description: Allows a user to delete their comment on a beat post.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comment_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Comment deleted successfully.
 *       400:
 *         description: Validation errors or unauthorized access.
 *       404:
 *         description: Comment not found.
 *       500:
 *         description: Server error.
 */
router.delete('/comment/delete', tokenProfileRequired, deleteCommentOnBeatPost);

/**
 * @swagger
 * /api/beat/purchase:
 *   post:
 *     summary: Purchase a beat post
 *     tags: [Beat]
 *     description: Allows a user to purchase a beat post.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               postId:
 *                 type: integer
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Beat post purchased successfully.
 *       400:
 *         description: Validation errors or insufficient balance.
 *       404:
 *         description: Post not found or sold out.
 *       500:
 *         description: Server error.
 */
router.post('/purchase', tokenProfileRequired, purchaseBeatPost);

/**
 * @swagger
 * /api/beat/user-posts:
 *   get:
 *     summary: Get all beat posts for the authenticated user
 *     tags: [Beat]
 *     description: Retrieves all beat posts created by the authenticated user.
 *     responses:
 *       200:
 *         description: List of beat posts.
 *       500:
 *         description: Server error.
 */
router.get('/user-posts', tokenProfileRequired, getUserBeatPosts);

/**
 * @swagger
 * /api/beat/{postId}:
 *   get:
 *     summary: Get a specific beat post by ID
 *     tags: [Beat]
 *     description: Retrieves a specific beat post along with its comments and reactions.
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the beat post
 *     responses:
 *       200:
 *         description: Beat post details.
 *       404:
 *         description: Beat post not found.
 *       500:
 *         description: Server error.
 */
router.get('/:postId', tokenProfileRequired, getBeatPostById);

/**
 * @swagger
 * /api/beat:
 *   get:
 *     summary: Get all beat posts with pagination
 *     tags: [Beat]
 *     description: Retrieves all beat posts with pagination support.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of posts per page
 *     responses:
 *       200:
 *         description: List of beat posts with pagination info.
 *       500:
 *         description: Server error.
 */
router.get('/', tokenProfileRequired, getBeatPosts);

module.exports = router;

