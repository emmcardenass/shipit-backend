import express from "express";
import {
  obtenerTarifasCliente,
  crearTarifaCliente,
  eliminarTarifaCliente,
  actualizarTarifaCliente
} from "../controllers/tarifaClienteController.js";

const router = express.Router();

router.get("/", obtenerTarifasCliente);
router.post("/", crearTarifaCliente);
router.delete("/:id", eliminarTarifaCliente);
router.put("/:id", actualizarTarifaCliente);

export default router;
