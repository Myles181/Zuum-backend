const { body } = require('express-validator');

// Validation middleware (create in a separate file, e.g., validators/profileValidator.js)
exports.createPostVideoValidator = [
    body('caption').isString().trim().notEmpty().withMessage('Caption cannot be empty'),
    body('public').isBoolean().withMessage('Public cannot be empty'),
    body('location').optional().isString().trim().withMessage('Apple must be a string'),
    body('tagged_people').optional().isString().trim().withMessage('Spotify must be a string'),
];

exports.updatePostVideoValidator = [
    body('post_id').isString().trim().notEmpty().withMessage('Post Id cannot be empty')
];

exports.deletePostVideoValidator = [
    body('post_id').isString().trim().notEmpty().withMessage('Post Id cannot be empty')
];

exports.reactToVideoPostValidator = [    
    body('post_id').isString().trim().notEmpty().withMessage('Post Id cannot be empty'),
    body('like').isBoolean().withMessage('Post Like cannot be empty'),
    body('unlike').isBoolean().withMessage('Post Unlike cannot be empty'),
];

exports.commentToVideoPostValidator = [
    body('post_id').isString().trim().notEmpty().withMessage('Post Id cannot be empty'),
    body('comment').isString().trim().notEmpty().withMessage('Comment cannot be empty')
];

exports.updateCommentOnVideoPostValidator = [
    body('new_comment').isString().trim().notEmpty().withMessage('Comment cannot be empty')
];

exports.deleteCommentOnVideoPostValidator = [
    body('comment_id').isString().trim().notEmpty().withMessage('Comment Id cannot be empty'),
];

exports.shareVideoPostValidator = [
    body('post_id').isString().trim().notEmpty().withMessage('Post Id cannot be empty'),
    body('content').isString().trim().notEmpty().withMessage('Content cannot be empty')
];

exports.updateSharedVideoPostValidator = [
    body('content').isString().trim().notEmpty().withMessage('Content cannot be empty')
]

exports.deleteSharedVideoPostValidator = [
    body('share_id').isString().trim().notEmpty().withMessage('Post Share Id cannot be empty')
]
