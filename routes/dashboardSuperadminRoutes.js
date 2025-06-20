// backend/routes/dashboardSuperadminRoutes.js
import express from "express";
import { obtenerEstadisticas, obtenerPedidosConCoordenadas } from "../controllers/dashboardSuperadminController.js";

const router = express.Router();

router.get("/stats", obtenerEstadisticas);
router.get("/pedidos-mapa", obtenerPedidosConCoordenadas); // 🆕 nueva ruta

export default router;
