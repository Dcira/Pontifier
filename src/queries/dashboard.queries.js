import { prisma } from "../config/db.js";

export async function selectDashboardStats() {
  const [
    total,
    confirmed,
    softYes,
    cold,
    lost,
    contactedRows,
  ] = await Promise.all([
    prisma.delegate.count(),
    prisma.delegate.count({ where: { status: "confirmed" } }),
    prisma.delegate.count({ where: { status: "soft_yes" } }),
    prisma.delegate.count({ where: { status: "cold" } }),
    prisma.delegate.count({ where: { status: "lost" } }),
    prisma.$queryRaw`
      SELECT COUNT(DISTINCT delegate_id)::int AS n
      FROM daily_register
      WHERE contact_date = CURRENT_DATE AND was_contacted = TRUE
    `,
  ]);

  const contactedN = Number(contactedRows[0]?.n ?? 0);
  const totalN = total;
  const contactRateToday = totalN > 0 ? Math.round((contactedN / totalN) * 1000) / 10 : 0;

  return {
    total_delegates: totalN,
    confirmed,
    soft_yes: softYes,
    cold,
    lost,
    contacted_today: contactedN,
    contact_rate_today: contactRateToday,
  };
}

export async function selectCollegeBreakdown() {
  return prisma.$queryRaw`
    SELECT c.id, c.name, c.code,
            COUNT(d.id)::int AS total_delegates,
            COUNT(d.id) FILTER (WHERE d.status = 'confirmed'::delegate_status)::int AS confirmed,
            COUNT(d.id) FILTER (WHERE d.status = 'soft_yes'::delegate_status)::int AS soft_yes,
            COUNT(d.id) FILTER (WHERE d.status = 'cold'::delegate_status)::int AS cold,
            COUNT(d.id) FILTER (WHERE d.status = 'lost'::delegate_status)::int AS lost,
            (
              SELECT COUNT(DISTINCT dr.delegate_id)::int
              FROM daily_register dr
              JOIN delegates d2 ON d2.id = dr.delegate_id
              WHERE d2.college_id = c.id
                AND dr.contact_date = CURRENT_DATE
                AND dr.was_contacted = TRUE
            ) AS contacted_today
     FROM colleges c
     LEFT JOIN delegates d ON d.college_id = c.id
     GROUP BY c.id, c.name, c.code
     ORDER BY c.id
  `;
}

export async function selectDailyActivity(days) {
  const d = Math.min(30, Math.max(1, Number(days) || 7));
  const startOffset = d - 1;
  return prisma.$queryRaw`
    WITH days AS (
       SELECT generate_series(
         CURRENT_DATE - CAST(${startOffset} AS INTEGER),
         CURRENT_DATE,
         '1 day'::interval
       )::date AS day
     )
     SELECT d.day::text AS date,
            COUNT(dr.id) FILTER (WHERE dr.was_contacted = TRUE)::int AS total_contacts,
            COUNT(DISTINCT dr.delegate_id) FILTER (WHERE dr.was_contacted = TRUE)::int AS unique_delegates,
            COUNT(dr.id) FILTER (WHERE dr.outcome = 'confirmed'::register_outcome)::int AS confirmed_outcomes
     FROM days d
     LEFT JOIN daily_register dr ON dr.contact_date = d.day
     GROUP BY d.day
     ORDER BY d.day
  `;
}
export async function selectRecentActivity(limit = 20) {
  const rows = await prisma.dailyRegister.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      delegate: { include: { college: true } },
      contactedBy: { select: { name: true } },
    },
  });
  return rows.map((dr) => ({
    id: dr.id,
    contact_date: dr.contactDate.toISOString().slice(0, 10),
    was_contacted: dr.wasContacted,
    outcome: dr.outcome,
    created_at: dr.createdAt,
    delegate_name: dr.delegate.name,
    college_name: dr.delegate.college.name,
    contacted_by_name: dr.contactedBy?.name ?? null,
  }));
}
export async function selectTopCanvassers(limit = 5) {
  const rows = await prisma.$queryRaw`
    SELECT
      u.id AS user_id,
      u.name,
      c.code AS college,
      COUNT(dr.id) FILTER (WHERE dr.was_contacted = TRUE)::int AS contacts_total,
      COUNT(dr.id) FILTER (WHERE dr.outcome = 'confirmed'::register_outcome)::int AS confirmed_count
    FROM daily_register dr
    JOIN users u ON u.id = dr.contacted_by
    LEFT JOIN colleges c ON c.id = u.college_id
    WHERE dr.was_contacted = TRUE
    GROUP BY u.id, u.name, c.code
    ORDER BY contacts_total DESC
    LIMIT ${limit}
  `;
  return rows.map(r => ({
    user_id: Number(r.user_id),
    name: r.name,
    college: r.college ?? '—',
    contacts_total: Number(r.contacts_total),
    confirmed_count: Number(r.confirmed_count),
  }));
}