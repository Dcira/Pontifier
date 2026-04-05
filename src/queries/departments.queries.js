import { prisma } from "../config/db.js";

export async function selectDepartmentsBySchool(schoolId) {
  const rows = await prisma.department.findMany({
    where: { schoolId: Number(schoolId) },
    orderBy: { name: "asc" },
  });
  return rows.map((d) => ({
    id: d.id,
    name: d.name,
    school_id: d.schoolId,
  }));
}

export async function selectAllDepartments() {
  const rows = await prisma.department.findMany({
    orderBy: { name: "asc" },
    include: {
      school: {
        select: {
          name: true,
          code: true,
          college: { select: { name: true, code: true } },
        },
      },
    },
  });
  return rows.map((d) => ({
    id: d.id,
    name: d.name,
    school_id: d.schoolId,
    school_name: d.school.name,
    school_code: d.school.code,
    college_name: d.school.college.name,
    college_code: d.school.college.code,
  }));
}
