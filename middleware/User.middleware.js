const { body } = require('express-validator');

// Validation middleware (create in a separate file, e.g., validators/profileValidator.js)
exports.updateProfileValidator = [
    body('username').optional().isString().trim().notEmpty().withMessage('Username cannot be empty'),
    body('email').optional().isEmail().normalizeEmail().withMessage('Invalid email'),
    body('phone_number').optional().isString().trim().withMessage('Invalid phone number'),
    body('bio').optional().isString().trim().withMessage('Bio must be a string'),
];