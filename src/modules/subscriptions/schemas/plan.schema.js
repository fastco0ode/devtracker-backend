const mongoose = require("mongoose");

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    displayName: {
      type: String,
    },
    price: {
      type: Number,
    },
    currency: {
      type: String,
      enum: ["EGP", "USD"],
    },
    interval: {
      type: String,
      enum: ["monthly", "yearly"],
    },
    tier: {
      type: String,
      enum: ["free", "pro", "enterprise"],
    },
    trialDays: {
      type: Number,
      default: 14,
    },
    limits: {
      maxProjects: {
        type: Number,
      },
      maxTeamMembers: {
        type: Number,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    stripeProductId: {
      type: String, // ده الـ prod_...
    },
    // ✅ الحقل ده اللي ناقص وموقف حالك
    stripePriceId: {
      type: String, // ده الـ price_...
    },
    paymobPlanId: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Plan", planSchema, "Plan");