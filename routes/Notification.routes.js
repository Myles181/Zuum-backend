const express = require('express');
const router = express.Router();

// Import Middleware
const { sendNotificationValidator } = require('../middleware/Notification.middleware');

// Import Controllers
const { getNotifications, deleteNotification, markNotificationAsRead, sendManualNotification} = require('../controllers/Notification.controller');


/**
 * @swagger
 * /notifications/{userId}:
 *   get:
 *     summary: Get all notifications for a user
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user to retrieve notifications for
 *     responses:
 *       200:
 *         description: List of notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 notifications:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       message:
 *                         type: string
 *                       type:
 *                         type: string
 *                         enum: [like, comment, follow, system]
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       read:
 *                         type: boolean
 *       500:
 *         description: Server error
 */
router.get('/:userId', getNotifications);

/**
 * @swagger
 * /notifications/{notificationId}/read:
 *   patch:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the notification to mark as read
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Server error
 */
router.patch('/:notificationId/read', markNotificationAsRead);

/**
 * @swagger
 * /notifications/{notificationId}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the notification to delete
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Server error
 */
router.delete('/:notificationId', deleteNotification);

/**
 * @swagger
 * /notifications/send:
 *   post:
 *     summary: Send a manual notification
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: ID of the user receiving the notification
 *               message:
 *                 type: string
 *                 description: The notification message
 *               type:
 *                 type: string
 *                 enum: [like, comment, follow, system]
 *                 description: Type of notification
 *     responses:
 *       200:
 *         description: Notification sent successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/send', sendNotificationValidator, sendManualNotification);

module.exports = router;
