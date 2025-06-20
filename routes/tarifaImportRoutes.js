// routes/tarifaImportRoutes.js
import express from 'express';
import multer from 'multer';
import xlsx from 'xlsx';
import Tarifa from '../models/Tarifa.js';
import Zona from '../models/Zona.js';

const router = express.Router();

// Configuración multer (memoria, no guardar en disco)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Mapeo de nombres de servicio
const servicioMap = {
  'Envío día siguiente': 'standard',
  'Envío mismo día': 'express',
  'Envío fulfillment': 'fulfillment',
};

router.post('/importar', upload.single('file'), async (req, res) => {
  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    // Detectar columnas de peso
    const header = json[0];
    const pesoCols = [];

    header.forEach((col, index) => {
      if (typeof col === 'string' && col.includes('-')) {
        const parts = col.split('-').map(s => s.trim());
        pesoCols.push({
          index,
          pesoMin: parseFloat(parts[0]),
          pesoMax: parseFloat(parts[1]),
        });
      }
    });

    // Procesar filas
    const tarifasToInsert = [];

    for (let i = 1; i < json.length; i++) {
      const row = json[i];

      const zonaId = row[0]?.toString().trim();
      const tipoServicioTexto = row[1]?.toString().trim();

      const tipoServicio = servicioMap[tipoServicioTexto];
      if (!tipoServicio) {
        console.warn(`❗ Tipo de servicio no reconocido en fila ${i + 1}: "${tipoServicioTexto}"`);
        continue;
      }

      // Verificar que la zona existe
      const zonaExiste = await Zona.findById(zonaId);
      if (!zonaExiste) {
        console.warn(`❗ Zona no encontrada en fila ${i + 1}: "${zonaId}"`);
        continue;
      }

      // Procesar columnas de peso
      for (const pesoCol of pesoCols) {
        const precioCell = row[pesoCol.index];
        if (precioCell !== undefined && precioCell !== null && precioCell !== '' && precioCell !== '...') {
          const precio = parseFloat(precioCell);
          if (isNaN(precio)) continue;

          tarifasToInsert.push({
            zonas: [zonaId],
            tipoServicio,
            pesoMin: pesoCol.pesoMin,
            pesoMax: pesoCol.pesoMax,
            precio,
          });
        }
      }
    }

    // Insertar en la BD
    if (tarifasToInsert.length > 0) {
      await Tarifa.insertMany(tarifasToInsert);
      return res.json({ mensaje: `✅ ${tarifasToInsert.length} tarifas importadas correctamente.` });
    } else {
      return res.status(400).json({ mensaje: 'No se encontraron tarifas válidas para importar.' });
    }
  } catch (error) {
    console.error('❌ Error al importar tarifas:', error);
    res.status(500).json({ mensaje: 'Error al importar tarifas', error });
  }
});

export default router;
