import { prisma } from "../config/db.js";

function mapUserRow(u) {
  if (!u) return null;
  const college = u.college;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    password: u.password,
    role: u.role,
    college_id: u.collegeId,
    college_code: college?.code ?? null,
    college_name: college?.name ?? null,
    is_first_login: u.isFirstLogin,
    is_active: u.isActive,
    created_at: u.createdAt,
    updated_at: u.updatedAt,
  };
}

export async function selectUserByEmail(email) {
  const u = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    include: { college: true },
  });
  return mapUserRow(u);
}

export async function selectUserById(id) {
  const u = await prisma.user.findUnique({
    where: { id },
    include: { college: true },
  });
  return mapUserRow(u);
}

export async function insertRefreshToken(userId, token, expiresAt) {
  const row = await prisma.refreshToken.create({
    data: { userId, token, expiresAt },
    select: { id: true },
  });
  return row;
}

export async function selectRefreshTokenRow(token) {
  const row = await prisma.refreshToken.findFirst({ where: { token } });
  if (!row) return null;
  return {
    id: row.id,
    user_id: row.userId,
    token: row.token,
    expires_at: row.expiresAt,
    is_revoked: row.isRevoked,
  };
}

export async function revokeRefreshToken(token) {
  await prisma.refreshToken.updateMany({
    where: { token },
    data: { isRevoked: true },
  });
}
