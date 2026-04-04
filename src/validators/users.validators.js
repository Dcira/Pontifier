import { body, param, query } from "express-validator";

export const listUsersValidators = [
  query("role").optional().isIn(["admin", "college_manager", "team_member"]),
  query("college_id").optional().isInt(),
  query("is_active").optional().isIn(["true", "false"]),
];

export const createUserValidators = [
  body("name").trim().isLength({ min: 1, max: 255 }).withMessage("Name required"),
  body("email").trim().isEmail().withMessage("Valid email required"),
  body("role").isIn(["admin", "college_manager", "team_member"]).withMessage("Invalid role"),
  body("college_id")
    .optional()
    .isInt()
    .custom((value, { req }) => {
      if (req.body.role === "college_manager" && (value === undefined || value === null)) {
        throw new Error("college_id is required for college_manager");
      }
      return true;
    }),
];

export const userIdParam = [param("id").isUUID().withMessage("Invalid user id")];
