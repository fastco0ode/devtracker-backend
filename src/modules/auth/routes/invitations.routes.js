const express = require('express');
const { sendInvite, getMyInvitations, respondToInvitation, getTeamMembers, removeTeamMember, updateMemberPermission } = require('../controllers/teamscontrollers/teams');
const { protect } = require('../../../middlewares/auth.middleware');
const isTeamOwner = require('../../../middlewares/isTeamOwner.middleware');
const invitaionsRouter = express.Router();
invitaionsRouter.post('/sendinvitaions' ,protect ,sendInvite);
invitaionsRouter.get('/getallinetations' ,protect ,getMyInvitations);
invitaionsRouter.post("/respond/:invitationId",protect , respondToInvitation)
invitaionsRouter.get("/members", protect, getTeamMembers)
invitaionsRouter.delete("/members/:memberId",  protect, isTeamOwner , removeTeamMember)
invitaionsRouter.patch("/members/:memberId/permissions", protect, isTeamOwner, updateMemberPermission);
module.exports = {invitaionsRouter}