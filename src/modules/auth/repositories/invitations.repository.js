const Invitation = require('../schemas/invitation.schema')
const Developer = require("../schemas/developer.schema")
const createInvitation = async (senderId, recipientEmail) => {
  return await Invitation.create({
    sender: senderId,
    recipientEmail,
    status: "pending",
  });
};

const findPendingInvite = async (senderId, recipientEmail) => {
  return await Invitation.findOne({
    sender: senderId,
    recipientEmail,
    status: "pending",
  });
};

const findInvitesForUser = async (email) => {
  return await Invitation.find({ recipientEmail: email, status: "pending" })
    .populate("sender", "name email") 
    .sort({ createdAt: -1 });
};

const findInviteById = async (id) => {
  return await Invitation.findById(id);
};


const updateInvitationStatus = async (invitationId, status) => {
  return await Invitation.findByIdAndUpdate(
    invitationId,
    { status },
    { new: true }
  );
};


const findTeamMembers = async (adminId) => {
  // بندور على كل الديفلوبرز اللي الـ adminId موجود في الـ teams array بتاعتهم
  return await Developer.find({
    "teams.adminId": adminId
  }).select("name email teams.$"); // الـ teams.$ بترجع بس بيانات الفريق ده مش كل الفرق
};

const removeMemberFromTeam = async (adminId, memberId) => {
  return await Developer.findByIdAndUpdate(
    memberId,
    { $pull: { teams: { adminId: adminId } } },
    { new: true }
  );
};


// لو عايز تعدل بالواحدة
const updateSinglePermission = async (adminId, memberId, key, value) => {
  const updateQuery = {};
  updateQuery[`teams.$.permissions.${key}`] = value; // ديناميك كي

  return await Developer.findOneAndUpdate(
    { _id: memberId, "teams.adminId": adminId },
    { $set: updateQuery },
    { new: true }
  );
};
module.exports = {
  createInvitation,
  findPendingInvite,
  findInvitesForUser,
  findInviteById,
  updateInvitationStatus,
  findTeamMembers,
  removeMemberFromTeam,
  updateSinglePermission
  
}