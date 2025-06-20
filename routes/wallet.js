// backend/routes/wallet.js
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getWalletData,
  migrateToSaldo,
  solicitarRetiro,
} from "../controllers/walletController.js";

const router = express.Router();

router.get("/", authMiddleware, getWalletData);
router.post("/migrar", authMiddleware, migrateToSaldo);
router.post("/retiro", authMiddleware, solicitarRetiro);

export default router;
