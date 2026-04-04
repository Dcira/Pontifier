import { body, param, query, check } from "express-validator";

export const listDelegatesValidators = [
  query("college_id").optional().isInt(),
  query("status").optional().isIn(["confirmed", "soft_yes", "cold", "lost"]),
  query("search").optional().isString(),
  query("assigned_to").optional().isUUID(),
];

export const createDelegateValidators = [
  body("name").trim().isLength({ min: 1, max: 255 }),
  body("college_id").isInt(),
  body("contact").optional().isString().isLength({ max: 20 }),
  body("notes").optional().isString(),
  body("status").optional().isIn(["confirmed", "soft_yes", "cold", "lost"]),
];

export const delegateIdParam = [param("id").isUUID()];

export const patchDelegateValidators = [
  body("name").optional().trim().isLength({ min: 1, max: 255 }),
  body("contact").optional({ nullable: true }).isString().isLength({ max: 20 }),
  body("notes").optional({ nullable: true }).isString(),
  check().custom((value, { req }) => {
    if (
      req.body.name === undefined &&
      req.body.contact === undefined &&
      req.body.notes === undefined
    ) {
      throw new Error("At least one of name, contact, or notes is required");
    }
    return true;
  }),
];

export const updateStatusValidators = [
  body("new_status").isIn(["confirmed", "soft_yes", "cold", "lost"]),
  body("notes").optional({ nullable: true }).isString(),
];

export const assignValidators = [body("team_member_id").isUUID()];

export const teamMemberIdParam = [param("team_member_id").isUUID()];
