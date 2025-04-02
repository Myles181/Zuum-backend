const { body } = require('express-validator');

// Validation middleware (create in a separate file, e.g., validators/profileValidator.js)
exports.updateProfileValidator = [
    body('username').optional().isString().trim().notEmpty().withMessage('Username cannot be empty'),
    body('email').optional().isEmail().normalizeEmail().withMessage('Invalid email'),
    body('phone_number').optional().isString().trim().withMessage('Invalid phone number'),
    body('bio').optional().isString().trim().withMessage('Bio must be a string'),
];

exports.followProfileValidator = [
    body('follow').isBoolean().withMessage('Follow user'),
    body('profileId').isString().withMessage('Followed profile Id'),
]

exports.virtualAccountValidator = [
    body('firstname').isString().trim().notEmpty().withMessage('First name cannot be emapty'),
    body('lastname').isString().trim().notEmpty().withMessage('Last name cannot be emapty'),
    body('phonenumber').isString().trim().notEmpty().withMessage('Phonenumber cannot be emapty'),
    body('bvn').isString().trim().notEmpty().withMessage('BVN cannot be empty')
        .isLength({ min: 11, max: 11 })
        .withMessage('BVN must be exactly 11 characters long')
        .matches(/^[1-9][0-9]{10}$/)
        .withMessage('BVN must be a positive or unsigned, non-zero number and must be 11 digits long'),
]
