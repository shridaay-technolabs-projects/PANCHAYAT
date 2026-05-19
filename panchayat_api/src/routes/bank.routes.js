import express from "express";
import auth from "../middleware/auth.js";
import {
  createBank,
  getBanks,
  updateBank,
  softDeleteBank,
} from "../controllers/bank.controller.js";

const router = express.Router();

router.get("/", auth, getBanks);
router.post("/", auth, createBank);
router.put("/:id", auth, updateBank);
router.delete("/:id", auth, softDeleteBank);

export default router;