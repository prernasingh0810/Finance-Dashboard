import { Router } from "express";
import {
  listRecords,
  getRecord,
  createRecord,
  updateRecord,
  deleteRecord,
  exportRecordsCSV,
} from "../controllers/recordController.js";
import { authenticate } from "../middleware/auth.js";
import { requireAdmin, requireAnalystOrAdmin } from "../middleware/rbac.js";
import { handleValidation } from "../middleware/validate.js";
import {
  createRecordRules,
  listRecordQueryRules,
  updateRecordRules,
} from "../validators/recordValidators.js";

export function createRecordRoutes(jwtSecret) {
  const r = Router();
  const auth = authenticate(jwtSecret);

  // IMPORTANT: /export must be before /:id otherwise Express treats "export" as an id
  r.get("/export", auth, requireAnalystOrAdmin, exportRecordsCSV);

  r.get("/", auth, requireAnalystOrAdmin, listRecordQueryRules, handleValidation, listRecords);
  r.get("/:id", auth, requireAnalystOrAdmin, getRecord);
  r.post("/", auth, requireAdmin, createRecordRules, handleValidation, createRecord);
  r.patch("/:id", auth, requireAdmin, updateRecordRules, handleValidation, updateRecord);
  r.delete("/:id", auth, requireAdmin, deleteRecord);

  return r;
}