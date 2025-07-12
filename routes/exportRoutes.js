import express from "express";
import { exportarRecolecciones, exportarEntregas } from "../controllers/exportPedidosController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Ruta para descargar recolecciones
router.get("/recolecciones", authMiddleware, exportarRecolecciones);

// Ruta para descargar entregas
router.get("/entregas", authMiddleware, exportarEntregas);

export default router;
