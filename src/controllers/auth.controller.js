import { prisma } from "../config/db.js";
import {
  selectUserByEmail,
  selectUserById,
  insertRefreshToken,
  selectRefreshTokenRow,
  revokeRefreshToken,
} from "../queries/auth.queries.js";
import { comparePassword, hashPassword } from "../utils/password.utils.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken, decodeTokenExpiry } from "../utils/jwt.utils.js";
import { successResponse } from "../utils/response.utils.js";
import { AppError } from "../utils/appError.js";

function mapUser(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    college_id: u.college_id,
    college_code: u.college_code,
    college_name: u.college_name,
    is_first_login: u.is_first_login,
    is_active: u.is_active,
  };
}

async function issueTokenPair(user) {
  const accessToken = signAccessToken({
    sub: user.id,
    role: user.role,
    collegeId: user.college_id,
  });
  const refreshToken = signRefreshToken({ sub: user.id });
  const expiresAt = decodeTokenExpiry(refreshToken);
  if (!expiresAt) {
    throw new AppError(500, "Could not determine refresh token expiry");
  }
  await insertRefreshToken(user.id, refreshToken, expiresAt);
  return { accessToken, refreshToken };
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const row = await selectUserByEmail(email);
    if (!row || !row.is_active) {
      throw new AppError(401, "Invalid email or password");
    }
    const ok = await comparePassword(password, row.password);
    if (!ok) {
      throw new AppError(401, "Invalid email or password");
    }

    const user = mapUser(row);
    const { accessToken, refreshToken } = await issueTokenPair(row);

    res.json(
      successResponse({
        user,
        accessToken,
        refreshToken,
        requiresPasswordChange: Boolean(row.is_first_login),
      })
    );
  } catch (e) {
    next(e);
  }
}

export async function changePassword(req, res, next) {
  try {
    const { current_password, new_password } = req.body;
    const row = await selectUserByEmail(req.user.email);
    if (!row) {
      throw new AppError(404, "User not found");
    }
    const ok = await comparePassword(current_password, row.password);
    if (!ok) {
      throw new AppError(400, "Current password is incorrect");
    }
    const hash = await hashPassword(new_password);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: req.user.id },
        data: { password: hash, isFirstLogin: false },
      }),
      prisma.refreshToken.updateMany({
        where: { userId: req.user.id, isRevoked: false },
        data: { isRevoked: true },
      }),
    ]);

    const fresh = await selectUserById(req.user.id);
    const user = mapUser(fresh);
    const { accessToken, refreshToken } = await issueTokenPair(fresh);

    res.json(
      successResponse({
        user,
        accessToken,
        refreshToken,
        requiresPasswordChange: false,
      })
    );
  } catch (e) {
    next(e);
  }
}

export async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError(401, "Invalid refresh token");
    }
    const row = await selectRefreshTokenRow(refreshToken);
    if (!row || row.is_revoked || new Date(row.expires_at) < new Date()) {
      throw new AppError(401, "Refresh token invalid or expired");
    }
    if (row.user_id !== decoded.sub) {
      throw new AppError(401, "Refresh token mismatch");
    }
    const userRow = await selectUserById(row.user_id);
    if (!userRow || !userRow.is_active) {
      throw new AppError(401, "User not available");
    }
    await revokeRefreshToken(refreshToken);
    const accessToken = signAccessToken({
      sub: userRow.id,
      role: userRow.role,
      collegeId: userRow.college_id,
    });
    const newRefresh = signRefreshToken({ sub: userRow.id });
    const expiresAt = decodeTokenExpiry(newRefresh);
    await insertRefreshToken(userRow.id, newRefresh, expiresAt);

    res.json(
      successResponse({
        accessToken,
        refreshToken: newRefresh,
        user: mapUser(userRow),
      })
    );
  } catch (e) {
    next(e);
  }
}

export async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;
    const row = await selectRefreshTokenRow(refreshToken);
    if (row && row.user_id === req.user.id) {
      await revokeRefreshToken(refreshToken);
    }
    res.json(successResponse({ loggedOut: true }));
  } catch (e) {
    next(e);
  }
}

export async function me(req, res, next) {
  try {
    const user = await selectUserById(req.user.id);
    if (!user) {
      throw new AppError(404, "User not found");
    }
    res.json(successResponse({ user: mapUser(user) }));
  } catch (e) {
    next(e);
  }
}
