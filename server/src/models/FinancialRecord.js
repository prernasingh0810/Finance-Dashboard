import mongoose from "mongoose";

export const ENTRY_TYPES = Object.freeze({
  INCOME: "income",
  EXPENSE: "expense",
});

// Priority levels for financial records
export const PRIORITY_LEVELS = Object.freeze({
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
});

const financialRecordSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: [0, "Amount cannot be negative"],
    },
    type: {
      type: String,
      enum: Object.values(ENTRY_TYPES),
      required: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },

    // NEW FIELD — priority of this financial record
    priority: {
      type: String,
      enum: Object.values(PRIORITY_LEVELS),
      default: PRIORITY_LEVELS.MEDIUM,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Soft delete — instead of removing, we set a timestamp
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes for faster queries
financialRecordSchema.index({ date: -1, type: 1, category: 1 });
financialRecordSchema.index({ deletedAt: 1 });
financialRecordSchema.index({ priority: 1 }); // NEW index for priority queries

// Soft delete method — marks record as deleted without removing from DB
financialRecordSchema.methods.softDelete = function softDelete() {
  this.deletedAt = new Date();
  return this.save();
};

// Helper method to check if record is deleted
financialRecordSchema.methods.isDeleted = function isDeleted() {
  return this.deletedAt !== null;
};

export const FinancialRecord = mongoose.model(
  "FinancialRecord",
  financialRecordSchema
);