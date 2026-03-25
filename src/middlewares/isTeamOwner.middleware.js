// middlewares/isTeamOwner.middleware.js
const Developer = require("../modules/auth/schemas/developer.schema");
const ApiError = require("../utils/apiErrors");

const isTeamOwner = async (req, res, next) => {
  try {
    const loggedInUserId = req.user._id.toString(); // الشخص اللي باعت الـ Request
    const { memberId } = req.params; // العضو اللي عايزين نغير صلاحياته

    // 1. هنجيب بيانات العضو اللي عايزين نعدل صلاحياته
    const member = await Developer.findById(memberId);
    if (!member) {
      return next(new ApiError(404, "Member not found"));
    }

    // 2. هندور في الـ teams بتاعته على الفريق اللي "الأدمن" بتاعه هو نفسه الـ loggedInUser
    const isOwnerOfThisMember = member.teams.some(
      (t) => t.adminId.toString() === loggedInUserId
    );

    // 3. لو مش هو الأونر بتاع المطور ده في الفريق، ارفض فوراً
    if (!isOwnerOfThisMember) {
      return next(new ApiError(403, "Access denied. Only the team owner (Admin) can modify permissions for this member."));
    }

    // لو هو الأونر، كمل للكنترولر بقلب جامد
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = isTeamOwner;