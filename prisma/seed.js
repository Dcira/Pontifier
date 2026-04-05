import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // ── Colleges ──────────────────────────────────────────────────────────────
  await prisma.college.createMany({
    data: [
      { name: "College of Health Sciences", code: "COHES" },
      { name: "College of Engineering and Technology", code: "COETEC" },
      { name: "College of Pure and Applied Sciences", code: "COPAS" },
      { name: "College of Agriculture and Natural Resources", code: "COANRE" },
      { name: "College of Humanities and Social Sciences", code: "COHRED" },
    ],
    skipDuplicates: true,
  });

  // Fetch colleges for FK references
  const colleges = await prisma.college.findMany();
  const collegeMap = Object.fromEntries(colleges.map((c) => [c.code, c.id]));

  // ── Schools ───────────────────────────────────────────────────────────────
  const schoolsData = [
    // COHES
    { name: "School of Pharmacy", code: "SOPHARM", collegeCode: "COHES" },
    { name: "School of Biomedical Sciences", code: "SOBMS", collegeCode: "COHES" },
    { name: "School of Nursing", code: "SON", collegeCode: "COHES" },
    { name: "School of Medicine", code: "SOMED", collegeCode: "COHES" },
    { name: "School of Public Health", code: "SOPH", collegeCode: "COHES" },
    // COPAS
    { name: "School of Mathematical and Physical Sciences", code: "SMPS", collegeCode: "COPAS" },
    { name: "School of Computing and Information Technology", code: "SCIT", collegeCode: "COPAS" },
    { name: "School of Biological Sciences", code: "SBS", collegeCode: "COPAS" },
    // COETEC
    { name: "School of Civil, Environmental and Geospatial Engineering", code: "SCEGE", collegeCode: "COETEC" },
    { name: "School of Mechanical, Manufacturing and Marine Engineering", code: "SOMMME", collegeCode: "COETEC" },
    { name: "School of Biosystems and Environmental Engineering", code: "SOBEE", collegeCode: "COETEC" },
    { name: "School of Architecture and Built Environment", code: "SABS", collegeCode: "COETEC" },
    { name: "School of Electrical, Electronic and Information Engineering", code: "SEEIE", collegeCode: "COETEC" },
    // COANRE
    { name: "School of Food, Nutrition and Sciences", code: "SOFNUS", collegeCode: "COANRE" },
    { name: "School of Agricultural and Environmental Sciences", code: "SOAES", collegeCode: "COANRE" },
    { name: "School of Natural Resources and Environmental Sciences", code: "SONRAS", collegeCode: "COANRE" },
    // COHRED
    { name: "School of Business and Economics", code: "SOBE", collegeCode: "COHRED" },
    { name: "School of Communication and Development Studies", code: "SCDS", collegeCode: "COHRED" },
  ];

  for (const s of schoolsData) {
    await prisma.school.upsert({
      where: { collegeId_code: { collegeId: collegeMap[s.collegeCode], code: s.code } },
      update: { name: s.name },
      create: { name: s.name, code: s.code, collegeId: collegeMap[s.collegeCode] },
    });
  }

  // Fetch schools for FK references
  const schools = await prisma.school.findMany();
  const schoolMap = Object.fromEntries(schools.map((s) => [s.code, s.id]));

  // ── Departments ───────────────────────────────────────────────────────────
  const departmentsData = [
    // COHES — SOPHARM
    { name: "Pharmacy", schoolCode: "SOPHARM" },
    // COHES — SOBMS
    { name: "Medical Laboratory Sciences", schoolCode: "SOBMS" },
    { name: "Medical Microbiology", schoolCode: "SOBMS" },
    { name: "Biochemistry", schoolCode: "SOBMS" },
    // COHES — SON
    { name: "Nursing", schoolCode: "SON" },
    // COHES — SOMED
    { name: "Medicine", schoolCode: "SOMED" },
    { name: "Rehabilitative Sciences", schoolCode: "SOMED" },
    { name: "Clinical Medicine", schoolCode: "SOMED" },
    // COHES — SOPH
    { name: "Environmental Health And Disease Control", schoolCode: "SOPH" },
    { name: "Health Records And Information Management", schoolCode: "SOPH" },
    { name: "Community Health", schoolCode: "SOPH" },
    // COPAS — SMPS
    { name: "Statistics And Actuarial Sciences", schoolCode: "SMPS" },
    { name: "Pure And Applied Mathematics", schoolCode: "SMPS" },
    { name: "Chemistry", schoolCode: "SMPS" },
    { name: "Physics", schoolCode: "SMPS" },
    // COPAS — SCIT
    { name: "Information Technology", schoolCode: "SCIT" },
    { name: "Computing", schoolCode: "SCIT" },
    // COPAS — SBS
    { name: "Botany", schoolCode: "SBS" },
    { name: "Zoology", schoolCode: "SBS" },
    // COETEC — SCEGE
    { name: "Geospatial Engineering And GIS", schoolCode: "SCEGE" },
    { name: "Civil And Construction Engineering", schoolCode: "SCEGE" },
    // COETEC — SOMMME
    { name: "Marine Engineering And Maritime Operations", schoolCode: "SOMMME" },
    { name: "Mining And Mineral Processing Engineering", schoolCode: "SOMMME" },
    { name: "Mechanical Engineering", schoolCode: "SOMMME" },
    { name: "Mechatronic Engineering", schoolCode: "SOMMME" },
    // COETEC — SOBEE
    { name: "Agricultural And Biosystem Engineering", schoolCode: "SOBEE" },
    { name: "Soil Water And Environmental Engineering", schoolCode: "SOBEE" },
    // COETEC — SABS
    { name: "Architecture", schoolCode: "SABS" },
    { name: "Construction Management", schoolCode: "SABS" },
    { name: "Landscape Architecture", schoolCode: "SABS" },
    // COETEC — SEEIE
    { name: "Telecommunication And Information Engineering", schoolCode: "SEEIE" },
    { name: "Electrical And Electronics Engineering", schoolCode: "SEEIE" },
    { name: "Electronic And Computer Engineering", schoolCode: "SEEIE" },
    // COANRE — SOFNUS
    { name: "Food Science And Technology", schoolCode: "SOFNUS" },
    { name: "Human Nutrition Sciences", schoolCode: "SOFNUS" },
    // COANRE — SOAES
    { name: "Dairy, Agriculture and Rural Economics", schoolCode: "SOAES" },
    { name: "Horticulture And Food Security", schoolCode: "SOAES" },
    // COANRE — SONRAS
    { name: "Landscape Planning And Management", schoolCode: "SONRAS" },
    { name: "Animal Sciences", schoolCode: "SONRAS" },
    // COHRED — SOBE
    { name: "Entrepreneurship, Technology and Leadership Management", schoolCode: "SOBE" },
    { name: "Procurement And Logistics", schoolCode: "SOBE" },
    { name: "Business Administration", schoolCode: "SOBE" },
    { name: "Economics, Accounts And Finance", schoolCode: "SOBE" },
    // COHRED — SCDS
    { name: "Development Studies", schoolCode: "SCDS" },
    { name: "Media Technology And Applied Communication", schoolCode: "SCDS" },
  ];

  for (const d of departmentsData) {
    const existing = await prisma.department.findFirst({
      where: { name: d.name, schoolId: schoolMap[d.schoolCode] },
    });
    if (!existing) {
      await prisma.department.create({
        data: { name: d.name, schoolId: schoolMap[d.schoolCode] },
      });
    }
  }

  // ── Admin user ────────────────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: "admin@campaign.com" },
    update: {},
    create: {
      name: "Javaas Abich",
      email: "admin@campaign.com",
      password: "$2b$12$A2XmAo6/LKr8F4AECjLEg.3wEM5iypYkxm4ISW8e2e0VXA6L.H47q",
      role: "admin",
      collegeId: null,
      isFirstLogin: false,
      isActive: true,
      createdById: null,
    },
  });

  console.log("✓ Seed complete — colleges, schools, departments, admin user");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });