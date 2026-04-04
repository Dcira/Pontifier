import { Prisma } from "@prisma/client";
import {
  selectDelegatesForAdmin,
  selectDelegatesForCollegeManager,
  selectDelegatesForTeamMember,
} from "./delegates.queries.js";
import { prisma } from "../config/db.js";

export async function fetchDelegatesForRegister(role, user, filters) {
  const f = {
    college_id: filters.college_id,
    status: filters.status,
    search: filters.search,
    assigned_to: filters.assigned_to,
  };
  if (role === "admin") return selectDelegatesForAdmin(f);
  if (role === "college_manager") return selectDelegatesForCollegeManager(user.college_id, f);
  return selectDelegatesForTeamMember(user.id, f);
}

export async function selectRegisterEntriesInRange(delegateIds, dateFrom, dateTo) {
  if (!delegateIds.length) return [];
  const idList = Prisma.join(delegateIds.map((id) => Prisma.sql`${id}::uuid`));
  return prisma.$queryRaw`
    SELECT dr.delegate_id, dr.contact_date::text AS contact_date, dr.was_contacted,
           dr.outcome::text AS outcome, dr.notes, dr.contacted_by
    FROM daily_register dr
    WHERE dr.delegate_id IN (${idList})
      AND dr.contact_date >= ${dateFrom}::date
      AND dr.contact_date <= ${dateTo}::date
  `;
}

function parseContactDate(ymd) {
  return new Date(`${ymd}T12:00:00.000Z`);
}

export async function upsertDailyRegister(payload) {
  const { delegateId, contactedBy, contactDate, wasContacted, outcome, notes } = payload;
  const date = parseContactDate(contactDate);
  const row = await prisma.dailyRegister.upsert({
    where: {
      delegateId_contactDate_contactedById: {
        delegateId,
        contactDate: date,
        contactedById: contactedBy,
      },
    },
    create: {
      delegateId,
      contactedById: contactedBy,
      contactDate: date,
      wasContacted,
      outcome: outcome || null,
      notes: notes ?? null,
    },
    update: {
      wasContacted,
      outcome: outcome || null,
      notes: notes ?? null,
    },
    select: {
      id: true,
      delegateId: true,
      contactDate: true,
      wasContacted: true,
      outcome: true,
      notes: true,
      contactedById: true,
    },
  });
  return {
    id: row.id,
    delegate_id: row.delegateId,
    contact_date: row.contactDate.toISOString().slice(0, 10),
    was_contacted: row.wasContacted,
    outcome: row.outcome,
    notes: row.notes,
    contacted_by: row.contactedById,
  };
}

export async function selectRegisterEntryForSocket(delegateId, contactDate, contactedBy) {
  const rows = await prisma.$queryRaw`
    SELECT dr.delegate_id, dr.contact_date::text AS contact_date, dr.was_contacted,
           dr.outcome::text AS outcome, d.name AS delegate_name,
           u.name AS contacted_by_name, d.college_id
    FROM daily_register dr
    JOIN delegates d ON d.id = dr.delegate_id
    LEFT JOIN users u ON u.id = dr.contacted_by
    WHERE dr.delegate_id = ${delegateId}::uuid
      AND dr.contact_date = ${contactDate}::date
      AND dr.contacted_by = ${contactedBy}::uuid
  `;
  return rows[0] || null;
}