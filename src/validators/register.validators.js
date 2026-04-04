import { body, query } from "express-validator";

export const getRegisterValidators = [
  query("date_from").optional().matches(/^\d{4}-\d{2}-\d{2}$/),
  query("date_to").optional().matches(/^\d{4}-\d{2}-\d{2}$/),
  query("college_id").optional().isInt(),
];

export const postRegisterValidators = [
  body("delegate_id").isUUID(),
  body("contact_date").matches(/^\d{4}-\d{2}-\d{2}$/),
  body("was_contacted").isBoolean(),
  body("outcome").optional({ nullable: true }).isIn(["confirmed", "soft_yes", "no_response", "rejected"]),
  body("notes").optional({ nullable: true }).isString(),
];
