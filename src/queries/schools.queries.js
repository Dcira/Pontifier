import { prisma } from "../config/db.js";

export async function selectSchoolsByCollege(collegeId) {
  const rows = await prisma.school.findMany({
    where: { collegeId: Number(collegeId) },
    orderBy: { name: "asc" },
  });
  return rows.map((s) => ({
    id: s.id,
    name: s.name,
    code: s.code,
    college_id: s.collegeId,
  }));
}

export async function selectAllSchools() {
  const rows = await prisma.school.findMany({
    orderBy: { name: "asc" },
    include: { college: { select: { name: true, code: true } } },
  });
  return rows.map((s) => ({
    id: s.id,
    name: s.name,
    code: s.code,
    college_id: s.collegeId,
    college_name: s.college.name,
    college_code: s.college.code,
  }));
}
