import { getDashboardAnalytics } from "../services/analyticsService.js";
import { asyncHandler, sendSuccess } from "../utils/responseFormatter.js";

export const getDashboard = asyncHandler(async (_req, res) => {
  const data = await getDashboardAnalytics();
  sendSuccess(res, { data });
});
