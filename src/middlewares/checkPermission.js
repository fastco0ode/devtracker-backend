// middlewares/checkPermission.middleware.js
const ApiError = require("../utils/apiErrors");

const checkPermission = (permissionKey) => {
  return async (req, res, next) => {
    try {
      const user = req.user; // المطور اللي باعت الطلب
      // بنجيب الـ adminId سواء من الـ params أو الـ body
      const adminId = req.params.adminId || req.body.adminId; 

      if (!adminId) {
        return next(new ApiError(400, "Admin ID is required to check permissions"));
      }

      // 1. دور على الفريق ده في لستة الفرق بتاعة المطور
      const team = user.teams.find(t => t.adminId.toString() === adminId.toString());

      if (!team) {
        return next(new ApiError(403, "Access denied. You are not a member of this team."));
      }

      // 2. اتأكد إن الصلاحية المطلوبة موجودة وبـ true
      if (!team.permissions[permissionKey]) {
        return next(new ApiError(403, `Permission denied: You cannot perform this action (${permissionKey})`));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = checkPermission;