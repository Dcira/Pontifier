import {
  fetchDelegatesForRegister,
  selectRegisterEntriesInRange,
  upsertDailyRegister,
  selectRegisterEntryForSocket,
} from "../queries/register.queries.js";
import { canAccessDelegate } from "../queries/delegates.queries.js";
import { successResponse } from "../utils/response.utils.js";
import { AppError } from "../utils/appError.js";
import { getIo } from "../config/socket.js";

function toYmd(d) {
  const x = new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getKenyaDate() {
  return new Date(Date.now() + 3 * 60 * 60 * 1000);
}

function startOfWeekMonday(ref) {
  const x = new Date(ref);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}

function endOfWeekFromStart(monday) {
  const e = new Date(monday);
  e.setDate(monday.getDate() + 6);
  return e;
}

function eachDateInclusive(fromStr, toStr) {
  const out = [];
  const cur = new Date(`${fromStr}T12:00:00`);
  const end = new Date(`${toStr}T12:00:00`);
  while (cur <= end) {
    out.push(toYmd(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

export async function getRegister(req, res, next) {
  try {
    const clientDate = req.query.date_from ? new Date(req.query.date_from) : getKenyaDate();
    const monday = startOfWeekMonday(clientDate);
    const sunday = endOfWeekFromStart(monday);
    let dateFrom = req.query.date_from || toYmd(monday);
    let dateTo = req.query.date_to || toYmd(sunday);

    if (dateFrom > dateTo) {
      throw new AppError(400, "date_from must be before or equal to date_to");
    }

    const filters = { college_id: req.query.college_id };
    const delegates = await fetchDelegatesForRegister(req.user.role, req.user, filters);
    const ids = delegates.map((d) => d.id);
    const rows = await selectRegisterEntriesInRange(ids, dateFrom, dateTo);
    const sorted = [...rows].sort((a, b) => {
      const au = a.contacted_by === req.user.id ? 1 : 0;
      const bu = b.contacted_by === req.user.id ? 1 : 0;
      return au - bu;
    });

    const byDel = new Map();
    for (const r of sorted) {
      if (!byDel.has(r.delegate_id)) byDel.set(r.delegate_id, new Map());
      const m = byDel.get(r.delegate_id);
      const key = r.contact_date;
      const existing = m.get(key);
      const myId = req.user.id;
      const merged = existing
        ? {
            was_contacted: Boolean(existing.was_contacted || r.was_contacted),
            outcome: r.contacted_by === myId ? r.outcome : existing.outcome || r.outcome,
            has_my_entry: Boolean(
              existing.has_my_entry || (r.contacted_by === myId && r.was_contacted)
            ),
          }
        : {
            was_contacted: r.was_contacted,
            outcome: r.outcome,
            has_my_entry: Boolean(r.contacted_by === myId && r.was_contacted),
          };
      m.set(key, merged);
    }

    const dates = eachDateInclusive(dateFrom, dateTo);
    const payloadDelegates = delegates.map((d) => {
      const entries = {};
      const dm = byDel.get(d.id) || new Map();
      for (const dt of dates) {
        const cell = dm.get(dt);
        entries[dt] = cell || { was_contacted: false, outcome: null, has_my_entry: false };
      }
      return {
        id: d.id,
        name: d.name,
        college: d.college_code,
        college_name: d.college_name,
        status: d.status,
        entries,
      };
    });

    res.json(successResponse({ delegates: payloadDelegates, dates }));
  } catch (e) {
    next(e);
  }
}

export async function postRegister(req, res, next) {
  try {
    const { delegate_id, contact_date, was_contacted, outcome, notes } = req.body;
    const access = await canAccessDelegate(delegate_id, req.user.role, req.user.id, req.user.college_id);
    if (!access.ok) {
      throw new AppError(404, "Delegate not found");
    }

    const today = toYmd(getKenyaDate());
    if (contact_date > today) {
      throw new AppError(400, "contact_date cannot be in the future");
    }
    const cd = new Date(`${contact_date}T12:00:00+03:00`);
    const t = new Date(`${today}T12:00:00+03:00`);
    const diffDays = Math.floor((t - cd) / (86400000));
    if (diffDays > 7) {
      throw new AppError(400, "contact_date cannot be more than 7 days in the past");
    }

    const row = await upsertDailyRegister({
      delegateId: delegate_id,
      contactedBy: req.user.id,
      contactDate: contact_date,
      wasContacted: was_contacted,
      outcome: outcome || null,
      notes: notes || null,
    });

    const collegeId = access.delegate.college_id;
    const full = await selectRegisterEntryForSocket(delegate_id, contact_date, req.user.id);

    const socketPayload = {
      delegate_id,
      delegate_name: full?.delegate_name || access.delegate.name,
      contact_date,
      was_contacted: row.was_contacted,
      outcome: row.outcome,
      contacted_by_name: req.user.name,
    };
    try {
      const io = getIo();
      io.to("admin_room").emit("register_updated", socketPayload);
      if (collegeId) {
        io.to(`college_${collegeId}`).emit("register_updated", socketPayload);
      }
    } catch {
      /* ignore */
    }

    res.json(successResponse({ entry: row }));
  } catch (e) {
    next(e);
  }
}
