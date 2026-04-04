import { prisma } from "../config/db.js";

export async function selectAllColleges() {
  const rows = await prisma.college.findMany({ orderBy: { id: "asc" } });
  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    code: c.code,
    created_at: c.createdAt,
  }));
}

export async function selectCollegeById(id) {
  const c = await prisma.college.findUnique({ where: { id } });
  if (!c) return null;
  return { id: c.id, name: c.name, code: c.code };
}
