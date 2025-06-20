import express from 'express';
import multer from 'multer';
import {
  obtenerTarifas,
  crearTarifa,
  eliminarTarifa,
  actualizarTarifa,
  importarTarifasDesdeExcel,
  calcularPrecio, // ✅ aquí agrégalo
} from '../controllers/tarifaController.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Tarifa normal
router.get('/', obtenerTarifas);
router.post('/', crearTarifa);
router.delete('/:id', eliminarTarifa);
router.put('/:id', actualizarTarifa);
router.post('/calcular-precio', calcularPrecio); // ✅ perfecto

// 🚀 Ruta para importar desde Excel
router.post('/importar-excel', upload.single('archivo'), importarTarifasDesdeExcel);

export default router;
