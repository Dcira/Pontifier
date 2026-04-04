import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
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
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
