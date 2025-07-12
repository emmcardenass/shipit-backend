import express from "express";
import { exportarRecolecciones, exportarEntregas } from "../controllers/exportPedidosController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import isAdmin from "../middlewares/isAdmin.js";

const router = express.Router();

// Ruta para descargar recolecciones
router.get("/recolecciones", authMiddleware, isAdmin, exportarRecolecciones);

// Ruta para descargar entregas
router.get("/entregas", authMiddleware, isAdmin, exportarEntregas);

export default router;
