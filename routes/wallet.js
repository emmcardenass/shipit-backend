import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  agregarSaldo,
  getSolicitudesRecarga,
  aprobarRecarga,
  rechazarRecarga,
  editarRecarga,
  getWalletData,
  migrateToSaldo,
  solicitarRetiro,
} from "../controllers/walletController.js";

const router = express.Router();

router.get("/", authMiddleware, getWalletData);
router.post("/migrar", authMiddleware, migrateToSaldo);
router.post("/retiro", authMiddleware, solicitarRetiro);
router.post("/agregar-saldo", authMiddleware, agregarSaldo);
router.get("/solicitudes-recarga", authMiddleware, getSolicitudesRecarga);
router.post("/aprobar-recarga", authMiddleware, aprobarRecarga);
router.post("/rechazar-recarga", authMiddleware, rechazarRecarga);
router.post("/editar-recarga", authMiddleware, editarRecarga);

export default router;
