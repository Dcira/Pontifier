import { Prisma } from "@prisma/client";
import { prisma } from "../config/db.js";

const DELEGATE_LIST_SELECT = Prisma.sql`
  SELECT d.id, d.name, d.contact, d.notes, d.status::text AS status,
         d.college_id, d.school_id, d.department_id, d.reg_number,
         d.created_at, d.updated_at,
         c.name AS college_name, c.code AS college_code,
         s.name AS school_name, s.code AS school_code,
         dep.name AS department_name,
         (
           SELECT COALESCE(json_agg(json_build_object('id', u.id, 'name', u.name)), '[]'::json)
           FROM delegate_assignments da
           JOIN users u ON u.id = da.team_member_id
           WHERE da.delegate_id = d.id
         ) AS assignees,
         (
           SELECT MAX(dr.contact_date)::text
           FROM daily_register dr
           WHERE dr.delegate_id = d.id AND dr.was_contacted = TRUE
         ) AS last_contact_date
  FROM delegates d
  JOIN colleges c ON c.id = d.college_id
  LEFT JOIN schools s ON s.id = d.school_id
  LEFT JOIN departments dep ON dep.id = d.department_id
`;

function applyListFilters(conditions, filters) {
  if (filters.college_id) {
    conditions.push(Prisma.sql`d.college_id = ${Number(filters.college_id)}`);
  }
  if (filters.school_id) {
    conditions.push(Prisma.sql`d.school_id = ${Number(filters.school_id)}`);
  }
  if (filters.department_id) {
    conditions.push(Prisma.sql`d.department_id = ${Number(filters.department_id)}`);
  }
  if (filters.status) {
    conditions.push(Prisma.sql`d.status = ${filters.status}::delegate_status`);
  }
  if (filters.search) {
    conditions.push(Prisma.sql`d.name ILIKE ${"%" + filters.search + "%"}`);
  }
  if (filters.assigned_to) {
    conditions.push(
      Prisma.sql`EXISTS (SELECT 1 FROM delegate_assignments da2 WHERE da2.delegate_id = d.id AND da2.team_member_id = ${filters.assigned_to}::uuid)`
    );
  }
}

export async function selectDelegatesForAdmin(filters) {
  const conditions = [Prisma.sql`TRUE`];
  applyListFilters(conditions, filters);
  const whereClause = conditions.reduce((acc, c) => Prisma.sql`${acc} AND ${c}`);
  return prisma.$queryRaw`
    ${DELEGATE_LIST_SELECT}
    WHERE ${whereClause}
    ORDER BY d.name
  `;
}

export async function selectDelegatesForCollegeManager(collegeId, filters) {
  const conditions = [Prisma.sql`d.college_id = ${collegeId}`];
  applyListFilters(conditions, filters);
  const whereClause = conditions.reduce((acc, c) => Prisma.sql`${acc} AND ${c}`);
  return prisma.$queryRaw`
    ${DELEGATE_LIST_SELECT}
    WHERE ${whereClause}
    ORDER BY d.name
  `;
}

export async function selectDelegatesForTeamMember(teamMemberId, filters) {
  const conditions = [
    Prisma.sql`EXISTS (SELECT 1 FROM delegate_assignments da0 WHERE da0.delegate_id = d.id AND da0.team_member_id = ${teamMemberId}::uuid)`,
  ];
  applyListFilters(conditions, filters);
  const whereClause = conditions.reduce((acc, c) => Prisma.sql`${acc} AND ${c}`);
  return prisma.$queryRaw`
    ${DELEGATE_LIST_SELECT}
    WHERE ${whereClause}
    ORDER BY d.name
  `;
}

export async function selectDelegateById(id) {
  const rows = await prisma.$queryRaw`
    SELECT d.id, d.name, d.contact, d.notes, d.status::text AS status,
           d.college_id, d.school_id, d.department_id, d.reg_number,
           d.created_at, d.updated_at,
           c.name AS college_name, c.code AS college_code,
           s.name AS school_name, s.code AS school_code,
           dep.name AS department_name
    FROM delegates d
    JOIN colleges c ON c.id = d.college_id
    LEFT JOIN schools s ON s.id = d.school_id
    LEFT JOIN departments dep ON dep.id = d.department_id
    WHERE d.id = ${id}::uuid
  `;
  return rows[0] || null;
}

export async function selectDelegateCollegeId(delegateId) {
  const d = await prisma.delegate.findUnique({
    where: { id: delegateId },
    select: { collegeId: true },
  });
  return d?.collegeId ?? null;
}

export async function insertDelegate({ name, collegeId, schoolId, departmentId, contact, notes, status, addedBy, regNumber }) {
  const statusVal = !status || status === "" ? "soft_yes" : status;
  const row = await prisma.delegate.create({
    data: {
      name,
      collegeId,
      schoolId: schoolId ?? null,
      departmentId: departmentId ?? null,
      contact: contact ?? null,
      notes: notes ?? null,
      status: statusVal,
      addedById: addedBy ?? null,
      regNumber: regNumber ?? null,
    },
    select: {
      id: true,
      name: true,
      collegeId: true,
      schoolId: true,
      departmentId: true,
      contact: true,
      notes: true,
      status: true,
      regNumber: true,
      createdAt: true,
    },
  });
  return {
    id: row.id,
    name: row.name,
    college_id: row.collegeId,
    school_id: row.schoolId,
    department_id: row.departmentId,
    contact: row.contact,
    notes: row.notes,
    status: row.status,
    reg_number: row.regNumber,
    created_at: row.createdAt,
  };
}

export async function updateDelegateFields(id, patch) {
  const data = {};
  if (Object.prototype.hasOwnProperty.call(patch, "name")) data.name = patch.name;
  if (Object.prototype.hasOwnProperty.call(patch, "contact")) data.contact = patch.contact;
  if (Object.prototype.hasOwnProperty.call(patch, "notes")) data.notes = patch.notes;
  if (!Object.keys(data).length) return selectDelegateById(id);
  try {
    const row = await prisma.delegate.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        contact: true,
        notes: true,
        status: true,
        collegeId: true,
        updatedAt: true,
      },
    });
    return {
      id: row.id,
      name: row.name,
      contact: row.contact,
      notes: row.notes,
      status: row.status,
      college_id: row.collegeId,
      updated_at: row.updatedAt,
    };
  } catch {
    return null;
  }
}

export async function updateDelegateStatus(id, newStatus) {
  try {
    const row = await prisma.delegate.update({
      where: { id },
      data: { status: newStatus },
      select: { id: true, status: true },
    });
    return { id: row.id, status: row.status };
  } catch {
    return null;
  }
}

export async function insertStatusHistory({ delegateId, oldStatus, newStatus, changedBy, notes }) {
  await prisma.statusHistory.create({
    data: {
      delegateId,
      oldStatus: oldStatus ?? null,
      newStatus,
      changedById: changedBy ?? null,
      notes: notes ?? null,
    },
  });
}

export async function insertDelegateAssignment({ delegateId, teamMemberId, assignedBy }) {
  try {
    const row = await prisma.delegateAssignment.create({
      data: {
        delegateId,
        teamMemberId,
        assignedById: assignedBy ?? null,
      },
      select: { id: true },
    });
    return row;
  } catch (e) {
    if (e.code === "P2002") return null;
    throw e;
  }
}

export async function deleteDelegateAssignment(delegateId, teamMemberId) {
  const result = await prisma.delegateAssignment.deleteMany({
    where: { delegateId, teamMemberId },
  });
  return result.count > 0;
}

export async function selectUserRoleAndCollege(userId) {
  const u = await prisma.user.findFirst({
    where: { id: userId, isActive: true },
    select: { role: true, collegeId: true },
  });
  if (!u) return null;
  return { role: u.role, college_id: u.collegeId };
}

export async function selectDelegateDetailHistory(delegateId) {
  const [contacts, statusHist, assignees] = await Promise.all([
    prisma.$queryRaw`
      SELECT dr.id, dr.contact_date::text, dr.was_contacted, dr.outcome::text AS outcome, dr.notes,
             u.name AS contacted_by_name
      FROM daily_register dr
      LEFT JOIN users u ON u.id = dr.contacted_by
      WHERE dr.delegate_id = ${delegateId}::uuid
      ORDER BY dr.contact_date DESC, dr.created_at DESC
    `,
    prisma.$queryRaw`
      SELECT sh.id, sh.old_status, sh.new_status, sh.changed_at, sh.notes, u.name AS changed_by_name
      FROM status_history sh
      LEFT JOIN users u ON u.id = sh.changed_by
      WHERE sh.delegate_id = ${delegateId}::uuid
      ORDER BY sh.changed_at DESC
    `,
    prisma.$queryRaw`
      SELECT u.id, u.name, u.email
      FROM delegate_assignments da
      JOIN users u ON u.id = da.team_member_id
      WHERE da.delegate_id = ${delegateId}::uuid
    `,
  ]);
  return { contacts, status_history: statusHist, assignees };
}

export async function selectCollegeIdsForTeamMember(teamMemberId) {
  const rows = await prisma.delegateAssignment.findMany({
    where: { teamMemberId },
    select: { delegate: { select: { collegeId: true } } },
  });
  const ids = [...new Set(rows.map((r) => r.delegate.collegeId).filter((id) => id != null))];
  return ids;
}

export async function assertTeamMemberRole(userId) {
  const u = await prisma.user.findFirst({
    where: { id: userId, role: "team_member", isActive: true },
    select: { id: true },
  });
  return u || null;
}

export async function canAccessDelegate(delegateId, role, userId, collegeId) {
  const del = await selectDelegateById(delegateId);
  if (!del) return { ok: false, delegate: null };
  if (role === "admin") return { ok: true, delegate: del };
  if (role === "college_manager") {
    if (Number(del.college_id) !== Number(collegeId)) return { ok: false, delegate: del };
    return { ok: true, delegate: del };
  }
  if (role === "team_member") {
    const n = await prisma.delegateAssignment.count({
      where: { delegateId, teamMemberId: userId },
    });
    if (!n) return { ok: false, delegate: del };
    return { ok: true, delegate: del };
  }
  return { ok: false, delegate: del };
}

export async function bulkInsertDelegates(rows) {
  const results = { inserted: 0, skipped: 0, errors: [] };
  for (const row of rows) {
    try {
      await prisma.delegate.create({
        data: {
          name: row.name,
          regNumber: row.reg_number || null,
          collegeId: row.college_id,
          schoolId: row.school_id || null,
          departmentId: row.department_id || null,
          contact: row.contact || null,
          notes: row.notes || null,
          status: row.status || "soft_yes",
          addedById: row.added_by || null,
        },
      });
      results.inserted++;
    } catch (e) {
      results.skipped++;
      results.errors.push({ row: row.name, reason: e.message });
    }
  }
  return results;
}

export async function selectAllDelegatesForExport(collegeId = null) {
  return prisma.delegate.findMany({
    where: collegeId ? { collegeId } : {},
    include: {
      college: { select: { name: true, code: true } },
      school: { select: { name: true, code: true } },
      department: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}