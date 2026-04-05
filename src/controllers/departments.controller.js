import { selectDepartmentsBySchool, selectAllDepartments } from "../queries/departments.queries.js";
import { successResponse } from "../utils/response.utils.js";

export async function listDepartments(req, res, next) {
  try {
    const { school_id } = req.query;
    const departments = school_id
      ? await selectDepartmentsBySchool(school_id)
      : await selectAllDepartments();
    res.json(successResponse({ departments }));
  } catch (e) {
    next(e);
  }
}
