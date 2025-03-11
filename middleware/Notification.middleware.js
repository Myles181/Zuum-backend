const { body } = require("express-validator");

exports.sendNotificationValidator = [
  body("user_id").isInt({ min: 1 }).withMessage("User ID must be a valid integer"),

  body("message").isString().trim().notEmpty().withMessage("Message cannot be empty"),

  body("type").isString().trim().isIn(["like", "comment", "follow", "system"]).withMessage("Type must be one of: like, comment, follow, system, shared"),
];
