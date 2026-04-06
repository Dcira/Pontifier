import {
  selectDashboardStats,
  selectCollegeBreakdown,
  selectDailyActivity,
  selectRecentActivity,
  selectTopCanvassers,
  selectBestDays,
  selectCollegeResponsiveness,
  selectTeamPerformance,
} from "../queries/dashboard.queries.js";
import { successResponse } from "../utils/response.utils.js";

export async function getStats(req, res, next) {
  try {
    const stats = await selectDashboardStats();
    res.json(successResponse(stats));
  } catch (e) {
    next(e);
  }
}

export async function getCollegeBreakdown(req, res, next) {
  try {
    const rows = await selectCollegeBreakdown();
    res.json(successResponse({ colleges: rows }));
  } catch (e) {
    next(e);
  }
}

export async function getDailyActivity(req, res, next) {
  try {
    let days = parseInt(req.query.days || "7", 10);
    if (Number.isNaN(days) || days < 1) days = 7;
    if (days > 30) days = 30;
    const rows = await selectDailyActivity(days);
    res.json(successResponse({ days: rows }));
  } catch (e) {
    next(e);
  }
}

export async function getRecentActivity(req, res, next) {
  try {
    const rows = await selectRecentActivity(20);
    res.json(successResponse({ activity: rows }));
  } catch (e) {
    next(e);
  }
}

export async function getTopCanvassers(req, res, next) {
  try {
    const rows = await selectTopCanvassers(5);
    res.json(successResponse({ canvassers: rows }));
  } catch (e) {
    next(e);
  }
}

// ── New analytics endpoints ───────────────────────────────────────────────

export async function getBestDays(req, res, next) {
  try {
    const rows = await selectBestDays();
    res.json(successResponse({ days: rows }));
  } catch (e) {
    next(e);
  }
}

export async function getCollegeResponsiveness(req, res, next) {
  try {
    const rows = await selectCollegeResponsiveness();
    res.json(successResponse({ colleges: rows }));
  } catch (e) {
    next(e);
  }
}

export async function getTeamPerformance(req, res, next) {
  try {
    const rows = await selectTeamPerformance();
    res.json(successResponse({ members: rows }));
  } catch (e) {
    next(e);
  }
}