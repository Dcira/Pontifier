import { selectSchoolsByCollege, selectAllSchools } from "../queries/schools.queries.js";
import { successResponse } from "../utils/response.utils.js";
import { AppError } from "../utils/appError.js";

export async function listSchools(req, res, next) {
  try {
    const { college_id } = req.query;
    const schools = college_id
      ? await selectSchoolsByCollege(college_id)
      : await selectAllSchools();
    res.json(successResponse({ schools }));
  } catch (e) {
    next(e);
  }
}
