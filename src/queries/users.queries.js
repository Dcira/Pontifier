import { Prisma } from "@prisma/client";
import { prisma } from "../config/db.js";

export async function insertUser({ name, email, passwordHash, role, collegeId, createdBy }) {
  const row = await prisma.user.create({
    data: {
      name,
      email,
      password: passwordHash,
      role,
      collegeId: collegeId ?? null,
      createdById: createdBy ?? null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      collegeId: true,
      isFirstLogin: true,
      isActive: true,
      createdAt: true,
    },
  });
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    college_id: row.collegeId,
    is_first_login: row.isFirstLogin,
    is_active: row.isActive,
    created_at: row.createdAt,
  };
}

export async function selectUsersFiltered({ role, collegeId, isActive }) {
  const conditions = [Prisma.sql`TRUE`];

  if (role) {
    conditions.push(Prisma.sql`u.role = ${role}::user_role`);
  }
  if (collegeId !== undefined && collegeId !== null && collegeId !== "") {
    conditions.push(Prisma.sql`u.college_id = ${Number(collegeId)}`);
  }
  if (isActive !== undefined && isActive !== null && isActive !== "") {
    const active = isActive === "true" || isActive === true;
    conditions.push(Prisma.sql`u.is_active = ${active}`);
  }

  const whereClause = conditions.reduce((acc, c) => Prisma.sql`${acc} AND ${c}`);

  return prisma.$queryRaw`
    SELECT u.id, u.name, u.email, u.role::text AS role, u.college_id, u.is_first_login, u.is_active,
           u.created_at, u.updated_at,
           c.name AS college_name, c.code AS college_code,
           (
             SELECT COUNT(*)::int FROM delegate_assignments da WHERE da.team_member_id = u.id
           ) AS assigned_delegates_count,
           (
             SELECT COUNT(*)::int FROM daily_register dr
             WHERE dr.contacted_by = u.id AND dr.contact_date = CURRENT_DATE AND dr.was_contacted = TRUE
           ) AS delegates_contacted_today,
           (
             SELECT COUNT(*)::int FROM daily_register dr
             WHERE dr.contacted_by = u.id
               AND dr.contact_date >= (CURRENT_DATE - INTERVAL '6 days')
               AND dr.was_contacted = TRUE
           ) AS delegates_contacted_this_week
    FROM users u
    LEFT JOIN colleges c ON c.id = u.college_id
    WHERE ${whereClause}
    ORDER BY u.created_at DESC
  `;
}

export async function selectUserDetailStats(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { college: true },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      collegeId: true,
      isActive: true,
      createdAt: true,
      college: { select: { name: true } },
    },
  });
  if (!user) return null;

  const [assignCount, todayRows] = await Promise.all([
    prisma.delegateAssignment.count({ where: { teamMemberId: userId } }),
    prisma.$queryRaw`
      SELECT COUNT(*)::int AS n FROM daily_register
      WHERE contacted_by = ${userId}::uuid AND contact_date = CURRENT_DATE AND was_contacted = TRUE
    `,
  ]);
  const todayContacts = Number(todayRows[0]?.n ?? 0);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    college_id: user.collegeId,
    is_active: user.isActive,
    created_at: user.createdAt,
    college_name: user.college?.name ?? null,
    assigned_delegates_count: assignCount,
    contacts_today: todayContacts,
  };
}

export async function setUserActive(userId, isActive) {
  try {
    const row = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: { id: true, name: true, email: true, isActive: true },
    });
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      is_active: row.isActive,
    };
  } catch {
    return null;
  }
}