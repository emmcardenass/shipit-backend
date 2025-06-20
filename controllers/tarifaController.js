// backend/controllers/tarifasController.js
import Tarifa from "../models/Tarifa.js";
import Zona from "../models/Zona.js";
import XLSX from "xlsx";

// Obtener todas las tarifas
export const obtenerTarifas = async (req, res) => {
  try {
    const tarifas = await Tarifa.find();
    res.json(tarifas);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener tarifas" });
  }
};

// Crear nueva tarifa
export const crearTarifa = async (req, res) => {
  try {
    const { zonas, precio, pesoMin, pesoMax, tipoServicio, incluyeCOD, valorCOD } = req.body;

    if (!zonas || !zonas.length || !precio || !pesoMin || !pesoMax || !tipoServicio) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    const nueva = new Tarifa({
      zonas,
      precio,
      pesoMin,
      pesoMax,
      tipoServicio,
      incluyeCOD,
      valorCOD
    });

    await nueva.save();
    res.status(201).json(nueva);
  } catch (error) {
    res.status(500).json({ error: "Error al crear tarifa" });
  }
};

// Actualizar tarifa
export const actualizarTarifa = async (req, res) => {
  try {
    const { id } = req.params;
    const { zonas, precio, pesoMin, pesoMax, tipoServicio, incluyeCOD, valorCOD } = req.body;

    const actualizada = await Tarifa.findByIdAndUpdate(
      id,
      { zonas, precio, pesoMin, pesoMax, tipoServicio, incluyeCOD, valorCOD },
      { new: true }
    );

    if (!actualizada) {
      return res.status(404).json({ error: "Tarifa no encontrada" });
    }

    res.json(actualizada);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar tarifa" });
  }
};

// Eliminar tarifa
export const eliminarTarifa = async (req, res) => {
  try {
    const { id } = req.params;
    const eliminada = await Tarifa.findByIdAndDelete(id);
    if (!eliminada) {
      return res.status(404).json({ error: "Tarifa no encontrada" });
    }
    res.json({ mensaje: "Tarifa eliminada" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar tarifa" });
  }
};

// ✅ Importar tarifas desde Excel
export const importarTarifasDesdeExcel = async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No se subió ningún archivo" });
      }
  
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet);
  
      let totalImportadas = 0;
      let zonasFaltantes = new Set(); // para reporte opcional
  
      for (const row of data) {
        const zonaNombre = row["ZONA"]?.toString().trim(); // ✅ normal (sin normalizar, sin regex)
  
        if (!zonaNombre) {
          console.warn("Fila sin ZONA, se omite:", row);
          continue;
        }
  
        // Buscar zona → coincidencia exacta
        const zona = await Zona.findOne({ nombre: zonaNombre });
  
        if (!zona) {
          console.warn(`❌ Zona no encontrada: "${zonaNombre}"`);
          zonasFaltantes.add(zonaNombre);
          continue;
        }
  
        const tipoServicio = mapTipoServicio(row["TIPO DE SERVICIO"]);
  
        if (!tipoServicio) {
          console.warn(`❌ Tipo de servicio inválido: "${row["TIPO DE SERVICIO"]}"`);
          continue;
        }
  
        const pesoMin = parseFloat(row["PESO MIN (KG)"]);
        const pesoMax = parseFloat(row["PESO MAX (KG)"]);
        const precio = parseFloat(row["PRECIO"]);
  
        if (isNaN(pesoMin) || isNaN(pesoMax) || isNaN(precio)) {
          console.warn(`❌ Datos de peso o precio inválidos en fila:`, row);
          continue;
        }
  
        const nuevaTarifa = new Tarifa({
          zonas: [zona._id],
          precio,
          pesoMin,
          pesoMax,
          tipoServicio,
        });
  
        await nuevaTarifa.save();
        console.log(
          `✅ Tarifa creada: Zona "${zona.nombre}" | Servicio "${tipoServicio}" | ${pesoMin}-${pesoMax} kg | $${precio}`
        );
        totalImportadas++;
      }
  
      res.json({
        mensaje: `✅ Tarifas importadas: ${totalImportadas}`,
        zonasFaltantes: Array.from(zonasFaltantes), // por si lo quieres mostrar
      });
    } catch (error) {
      console.error("❌ Error al importar tarifas:", error);
      res.status(500).json({ error: "Error al importar tarifas" });
    }
  };
  

// ✅ Mapeo de tipo de servicio desde Excel
const mapTipoServicio = (valor) => {
    if (!valor) return "";
    const lower = valor.toLowerCase();
    if (lower.includes("mismo")) return "express";
    if (lower.includes("día siguiente") || lower.includes("dia siguiente")) return "standard";
    if (lower.includes("fulfillment")) return "fulfillment";
    return "";
  };  

// ✅ Calcular precio para un envío
export const calcularPrecio = async (req, res) => {
    try {
      const { destino, envio } = req.body;
      const coordenadasDestino = destino?.coordenadas || [];
      const peso = parseFloat(envio?.peso) || 0;
      console.log("➡️ Peso recibido para cálculo:", peso);
      const tipoServicio = envio?.tipo || "";
      const cod = envio?.cod || 0;
  
      if (!coordenadasDestino.length || !peso || !tipoServicio) {
        return res
          .status(400)
          .json({ error: "Faltan datos obligatorios o coordenadas inválidas" });
      }
  
      // Encontrar zona con $geoIntersects
      const zona = await Zona.findOne({
        poligono: {
          $geoIntersects: {
            $geometry: {
              type: "Point",
              coordinates: coordenadasDestino,
            },
          },
        },
      });
  
      if (!zona) {
        return res
          .status(404)
          .json({ error: "No tenemos cobertura en esta zona por el momento" });
      }
  
      console.log("🟢 Zona encontrada:", zona._id.toString(), zona.nombre);
  
      // Buscar tarifa que aplique en la zona encontrada
      let tarifas = await Tarifa.find({
        zonas: zona._id,
        tipoServicio,
        pesoMin: { $lte: peso },
        pesoMax: { $gte: peso },
      }).sort({ precio: -1 });
  
      let tarifa = tarifas?.[0] || null;
  
      // Si no hay tarifa en la zona → intentar con TODA LA COBERTURA
      if (!tarifa) {
        console.log("⚠️ No hay tarifa directa, buscando en TODA LA COBERTURA");
  
        const zonaToda = await Zona.findOne({ nombre: "TODA LA COBERTURA" });
  
        if (zonaToda) {
          const caeEnToda = await Zona.findOne({
            _id: zonaToda._id,
            poligono: {
              $geoIntersects: {
                $geometry: {
                  type: "Point",
                  coordinates: coordenadasDestino,
                },
              },
            },
          });
  
          if (caeEnToda) {
            let tarifasFallback = await Tarifa.find({
              zonas: zonaToda._id,
              tipoServicio,
              pesoMin: { $lte: peso },
              pesoMax: { $gte: peso },
            }).sort({ precio: -1 });
  
            tarifa = tarifasFallback?.[0] || null;
  
            if (!tarifa) {
              return res.status(404).json({
                error: "No tenemos cobertura en esta zona por el momento",
              });
            }
          } else {
            return res.status(404).json({
              error: "No tenemos cobertura en esta zona por el momento",
            });
          }
        } else {
          return res.status(404).json({
            error: "No tenemos cobertura en esta zona por el momento",
          });
        }
      }
  
      // ✅ Calcular costo COD (global)
      let costoCOD = 0;
      if (cod && Number(cod) > 0 && Number(cod) <= 3000) {
        costoCOD = 17; // comisión fija global
      }
  
      const total = tarifa.precio + costoCOD;
  
      // Respuesta
      res.json({
        zona: zona.nombre,
        precioBase: tarifa.precio,
        costoCOD,
        total,
      });
    } catch (error) {
      console.error("❌ Error al calcular precio:", error);
      res.status(500).json({ error: "Error al calcular precio" });
    }
  };
  