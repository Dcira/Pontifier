import { body } from "express-validator";

export const loginValidators = [
  body("email").trim().isEmail().withMessage("Valid email required"),
  body("password").isString().notEmpty().withMessage("Password required"),
];

export const changePasswordValidators = [
  body("current_password").isString().notEmpty().withMessage("Current password required"),
  body("new_password")
    .isString()
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters")
    .matches(/[A-Z]/)
    .withMessage("New password must contain an uppercase letter")
    .matches(/[a-z]/)
    .withMessage("New password must contain a lowercase letter")
    .matches(/[0-9]/)
    .withMessage("New password must contain a number"),
  body("confirm_new_password")
    .isString()
    .custom((v, { req }) => v === req.body.new_password)
    .withMessage("Passwords do not match"),
];

export const refreshValidators = [body("refreshToken").isString().notEmpty().withMessage("Refresh token required")];

export const logoutValidators = [body("refreshToken").isString().notEmpty().withMessage("Refresh token required")];
