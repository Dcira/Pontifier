import {
  selectDelegatesForAdmin,
  selectDelegatesForCollegeManager,
  selectDelegatesForTeamMember,
  selectDelegateById,
  insertDelegate,
  updateDelegateFields,
  updateDelegateStatus,
  insertStatusHistory,
  insertDelegateAssignment,
  deleteDelegateAssignment,
  selectDelegateDetailHistory,
  assertTeamMemberRole,
  canAccessDelegate,
  selectDelegateCollegeId,
  bulkInsertDelegates,
  selectAllDelegatesForExport,
} from "../queries/delegates.queries.js";
import { successResponse } from "../utils/response.utils.js";
import { AppError } from "../utils/appError.js";
import { getIo } from "../config/socket.js";
import * as XLSX from "xlsx";
import { prisma } from "../config/db.js";

function listFilters(query) {
  return {
    college_id: query.college_id,
    school_id: query.school_id,
    department_id: query.department_id,
    status: query.status,
    search: query.search,
    assigned_to: query.assigned_to,
  };
}

export async function listDelegates(req, res, next) {
  try {
    const f = listFilters(req.query);
    const { role, id, college_id: collegeId } = req.user;
    let rows;
    if (role === "admin") {
      rows = await selectDelegatesForAdmin(f);
    } else if (role === "college_manager") {
      if (!collegeId) throw new AppError(403, "College scope missing");
      rows = await selectDelegatesForCollegeManager(collegeId, f);
    } else {
      rows = await selectDelegatesForTeamMember(id, f);
    }
    res.json(successResponse({ delegates: rows }));
  } catch (e) {
    next(e);
  }
}

export async function createDelegate(req, res, next) {
  try {
    const { name, college_id, school_id, department_id, contact, notes, status, reg_number } = req.body;
    const row = await insertDelegate({
      name,
      regNumber: reg_number || null,
      collegeId: college_id,
      schoolId: school_id ? Number(school_id) : null,
      departmentId: department_id ? Number(department_id) : null,
      contact,
      notes,
      status,
      addedBy: req.user.id,
    });
    res.status(201).json(successResponse({ delegate: row }));
  } catch (e) {
    next(e);
  }
}

export async function patchDelegate(req, res, next) {
  try {
    const { id } = req.params;
    const access = await canAccessDelegate(id, req.user.role, req.user.id, req.user.college_id);
    if (!access.ok) throw new AppError(404, "Delegate not found");
    if (req.user.role === "college_manager" && Number(access.delegate.college_id) !== Number(req.user.college_id)) {
      throw new AppError(403, "Cannot edit delegates outside your college");
    }
    const patch = {};
    if (Object.prototype.hasOwnProperty.call(req.body, "name")) patch.name = req.body.name;
    if (Object.prototype.hasOwnProperty.call(req.body, "contact")) patch.contact = req.body.contact;
    if (Object.prototype.hasOwnProperty.call(req.body, "notes")) patch.notes = req.body.notes;
    if (!Object.keys(patch).length) throw new AppError(400, "No fields to update");
    const updated = await updateDelegateFields(id, patch);
    res.json(successResponse({ delegate: updated }));
  } catch (e) {
    next(e);
  }
}

export async function patchDelegateStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { new_status, notes } = req.body;
    const access = await canAccessDelegate(id, req.user.role, req.user.id, req.user.college_id);
    if (!access.ok) throw new AppError(404, "Delegate not found");
    if (req.user.role === "college_manager" && Number(access.delegate.college_id) !== Number(req.user.college_id)) {
      throw new AppError(403, "Cannot update status for delegates outside your college");
    }
    const current = await selectDelegateById(id);
    const oldStatus = current.status;
    const updated = await updateDelegateStatus(id, new_status);
    await insertStatusHistory({
      delegateId: id,
      oldStatus,
      newStatus: new_status,
      changedBy: req.user.id,
      notes: notes || null,
    });

    const collegeId = await selectDelegateCollegeId(id);
    const payload = {
      delegate_id: id,
      delegate_name: current.name,
      old_status: oldStatus,
      new_status,
      changed_by_name: req.user.name,
    };
    try {
      const io = getIo();
      io.to("admin_room").emit("delegate_status_updated", payload);
      if (collegeId) io.to(`college_${collegeId}`).emit("delegate_status_updated", payload);
    } catch { /* socket optional */ }

    res.json(successResponse({ delegate: updated }));
  } catch (e) {
    next(e);
  }
}

export async function assignDelegate(req, res, next) {
  try {
    const { id } = req.params;
    const { team_member_id } = req.body;
    const tm = await assertTeamMemberRole(team_member_id);
    if (!tm) throw new AppError(400, "Invalid team member");
    const del = await selectDelegateById(id);
    if (!del) throw new AppError(404, "Delegate not found");
    const inserted = await insertDelegateAssignment({
      delegateId: id,
      teamMemberId: team_member_id,
      assignedBy: req.user.id,
    });
    res.status(inserted ? 201 : 200).json(successResponse({ assigned: Boolean(inserted) }));
  } catch (e) {
    next(e);
  }
}

export async function unassignDelegate(req, res, next) {
  try {
    const { id, team_member_id } = req.params;
    const ok = await deleteDelegateAssignment(id, team_member_id);
    if (!ok) throw new AppError(404, "Assignment not found");
    res.json(successResponse({ removed: true }));
  } catch (e) {
    next(e);
  }
}

export async function getDelegate(req, res, next) {
  try {
    const { id } = req.params;
    const access = await canAccessDelegate(id, req.user.role, req.user.id, req.user.college_id);
    if (!access.ok) throw new AppError(404, "Delegate not found");
    const delegate = access.delegate;
    const history = await selectDelegateDetailHistory(id);
    res.json(successResponse({ delegate, ...history }));
  } catch (e) {
    next(e);
  }
}

export async function downloadTemplate(req, res, next) {
  try {
    const ws = XLSX.utils.aoa_to_sheet([
      ["registration_number", "name", "college_code", "school_code", "department_name", "contact", "status", "notes"],
      ["REG/2024/001", "John Doe", "COHES", "SOPHARM", "Pharmacy", "0712345678", "soft_yes", "Sample note"],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Delegates");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    res.setHeader("Content-Disposition", "attachment; filename=delegates_template.xlsx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buf);
  } catch (e) {
    next(e);
  }
}

export async function importDelegates(req, res, next) {
  try {
    if (!req.file) throw new AppError(400, "No file uploaded");
    const wb = XLSX.read(req.file.buffer, { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws);

    const colleges = await prisma.college.findMany();
    const collegeMap = Object.fromEntries(colleges.map((c) => [c.code.toLowerCase(), c.id]));

    const schools = await prisma.school.findMany();
    const schoolMap = Object.fromEntries(schools.map((s) => [s.code.toLowerCase(), s]));

    const departments = await prisma.department.findMany();
    const deptMap = Object.fromEntries(
      departments.map((d) => [`${d.schoolId}::${d.name.toLowerCase()}`, d.id])
    );

    const mapped = rows.map((r, i) => {
      const code = String(r.college_code || "").toLowerCase();
      const college_id = collegeMap[code];
      if (!college_id) throw new AppError(400, `Row ${i + 2}: unknown college_code "${r.college_code}"`);

      let school_id = null;
      let department_id = null;

      if (r.school_code) {
        const school = schoolMap[String(r.school_code).toLowerCase()];
        if (school) {
          school_id = school.id;
          if (r.department_name) {
            const deptKey = `${school.id}::${String(r.department_name).toLowerCase()}`;
            department_id = deptMap[deptKey] || null;
          }
        }
      }

      return {
        name: r.name,
        reg_number: r.registration_number || null,
        college_id,
        school_id,
        department_id,
        contact: r.contact ? String(r.contact) : null,
        status: r.status || "soft_yes",
        notes: r.notes || null,
        added_by: req.user.id,
      };
    });

    const results = await bulkInsertDelegates(mapped);
    res.json(successResponse(results));
  } catch (e) {
    next(e);
  }
}

export async function exportDelegates(req, res, next) {
  try {
    const collegeId = req.user.role === "college_manager" ? req.user.college_id : req.query.college_id || null;
    const format = req.query.format || "csv";
    const rows = await selectAllDelegatesForExport(collegeId ? Number(collegeId) : null);

    const data = rows.map((d) => ({
      registration_number: d.regNumber || "",
      name: d.name,
      college: d.college?.name || "",
      college_code: d.college?.code || "",
      school: d.school?.name || "",
      school_code: d.school?.code || "",
      department: d.department?.name || "",
      contact: d.contact || "",
      status: d.status,
      notes: d.notes || "",
      created_at: d.createdAt.toISOString().split("T")[0],
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Delegates");

    if (format === "csv") {
      const csv = XLSX.utils.sheet_to_csv(ws);
      res.setHeader("Content-Disposition", "attachment; filename=delegates.csv");
      res.setHeader("Content-Type", "text/csv");
      return res.send(csv);
    }

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    res.setHeader("Content-Disposition", "attachment; filename=delegates.xlsx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buf);
  } catch (e) {
    next(e);
  }
}