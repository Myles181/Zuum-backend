const { body } = require('express-validator');

// Validation middleware (create in a separate file, e.g., validators/profileValidator.js)
exports.createPostAudioValidator = [
    body('caption').isString().trim().notEmpty().withMessage('Caption cannot be empty'),
    body('type').isString().trim().notEmpty().withMessage('Type cannot be empty'),
    body('apple_music').optional().isString().trim().withMessage('Apple must be a string'),
    body('spotify').optional().isString().trim().withMessage('Spotify must be a string'),
    body('audiomark').optional().isString().trim().withMessage('Audiomark must be a string'),
    body('boomplay').optional().isString().trim().withMessage('Boomplay must be a string'),
];

exports.updatePostAudioValidator = [
    body('post_id').isString().trim().notEmpty().withMessage('Post Id cannot be empty')
];

exports.deletePostAudioValidator = [
    body('post_id').isString().trim().notEmpty().withMessage('Post Id cannot be empty')
];


exports.reactToAudioPostValidator = [    
    body('post_id').isString().trim().notEmpty().withMessage('Post Id cannot be empty'),
    body('like').isBoolean().withMessage('Post Like cannot be empty'),
    body('unlike').isBoolean().withMessage('Post Unlike cannot be empty'),
];

exports.commentToAudioPostValidator = [
    body('post_id').isString().trim().notEmpty().withMessage('Post Id cannot be empty'),
    body('comment').isString().trim().notEmpty().withMessage('Comment cannot be empty')
];

exports.updateCommentOnAudioPostValidator = [
    body('new_comment').isString().trim().notEmpty().withMessage('Comment cannot be empty')
];

exports.deleteCommentOnAudioPostValidator = [
    body('comment_id').isString().trim().notEmpty().withMessage('Comment Id cannot be empty'),
];

exports.shareAudioPostValidator = [
    body('post_id').isString().trim().notEmpty().withMessage('Post Id cannot be empty'),
    body('content').isString().trim().withMessage('Content cannot be empty')
];

exports.updateSharedAudioPostValidator = [
    body('content').isString().trim().notEmpty().withMessage('Content cannot be empty')
]

exports.deleteSharedAudioPostValidator = [
    body('share_id').isString().trim().notEmpty().withMessage('Post Share Id cannot be empty')
]

