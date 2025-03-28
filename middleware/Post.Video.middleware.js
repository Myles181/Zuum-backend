const { body } = require('express-validator');

// Validation middleware (create in a separate file, e.g., validators/profileValidator.js)
const createPostVideoValidator = [
    body('caption').isString().trim().notEmpty().withMessage('Caption cannot be empty'),
    body('public').isBoolean().withMessage('Public cannot be empty'),
    body('location').optional().isString().trim().withMessage('Apple must be a string'),
    body('tagged_people').optional().isString().trim().withMessage('Spotify must be a string'),
];

const updatePostVideoValidator = [
    body('post_id').isString().trim().notEmpty().withMessage('Post Id cannot be empty')
];

const deletePostVideoValidator = [
    body('post_id').isString().trim().notEmpty().withMessage('Post Id cannot be empty')
];

const reactToVideoPostValidator = [    
    body('post_id').isString().trim().notEmpty().withMessage('Post Id cannot be empty'),
    body('like').isBoolean().withMessage('Post Like cannot be empty'),
    body('unlike').isBoolean().withMessage('Post Unlike cannot be empty'),
];

const commentToVideoPostValidator = [
    body('post_id').isString().trim().notEmpty().withMessage('Post Id cannot be empty'),
    body('comment').isString().trim().withMessage('Comment cannot be empty')
];

const updateCommentOnVideoPostValidator = [
    body('new_comment').isString().trim().notEmpty().withMessage('Comment cannot be empty')
];

const deleteCommentOnVideoPostValidator = [
    body('comment_id').isString().trim().notEmpty().withMessage('Comment Id cannot be empty'),
];

const shareVideoPostValidator = [
    body('post_id').isString().trim().notEmpty().withMessage('Post Id cannot be empty'),
    body('content').isString().trim().notEmpty().withMessage('Content cannot be empty')
];

const updateSharedVideoPostValidator = [
    body('content').isString().trim().notEmpty().withMessage('Content cannot be empty')
]

const deleteSharedVideoPostValidator = [
    body('share_id').isString().trim().notEmpty().withMessage('Post Share Id cannot be empty')
]

module.exports = { createPostVideoValidator, updatePostVideoValidator, deletePostVideoValidator, reactToVideoPostValidator, commentToVideoPostValidator,updateCommentOnVideoPostValidator, deleteCommentOnVideoPostValidator, shareVideoPostValidator, updateSharedVideoPostValidator, deleteSharedVideoPostValidator };
