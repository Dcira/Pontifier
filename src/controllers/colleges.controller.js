import { selectAllColleges } from "../queries/colleges.queries.js";
import { successResponse } from "../utils/response.utils.js";

export async function listColleges(req, res, next) {
  try {
    const colleges = await selectAllColleges();
    res.json(successResponse({ colleges }));
  } catch (e) {
    next(e);
  }
}
