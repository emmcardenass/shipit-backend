import Pedido from "../models/Order.js";
import ExcelJS from "exceljs";
import moment from "moment-timezone";

function obtenerRangoOperativo(tipo = "recolecciones") {
  const ahora = moment.tz("America/Monterrey");

  let baseOperativa = ahora.clone().set({ hour: 9, minute: 0, second: 0, millisecond: 0 });
  if (ahora.isBefore(baseOperativa)) {
    baseOperativa.subtract(1, "day");
  }

  // ⛔ Si hoy es domingo, regresar al sábado
  if (baseOperativa.day() === 0) {
    baseOperativa.subtract(1, "day");
  }

  const desde = baseOperativa.clone().add(1, "second"); // 9:00:01 a.m.
  const hasta = baseOperativa.clone().add(1, "day");    // 9:00:00 a.m. siguiente

  if (tipo === "diaSiguiente") {
    return {
      desde: baseOperativa.clone().subtract(1, "day").add(1, "second").toDate(),
      hasta: baseOperativa.clone().toDate(),
    };
  }

  return { desde: desde.toDate(), hasta: hasta.toDate() };
}

function obtenerFechaEntregaNombreArchivo(fechaBase = Date.now()) {
  const fechaEntrega = new Date(fechaBase + 86400000);
  return fechaEntrega.toLocaleDateString("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).replaceAll("/", "-");
}

// ✅ RECOLECCIONES
export const exportarRecolecciones = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    let desde, hasta;
    if (fechaInicio && fechaFin) {
      desde = new Date(fechaInicio);
      hasta = new Date(`${fechaFin}T23:59:59`);
    } else {
      const rango = obtenerRangoOperativo("recolecciones");
      desde = rango.desde;
      hasta = rango.hasta;
    }

    console.log("📦 Recolecciones: desde", desde.toISOString(), "hasta", hasta.toISOString());

    const pedidos = await Pedido.find({ fechaRecoleccionProgramada: { $gte: desde, $lte: hasta } });

    console.log(`✅ Pedidos encontrados para recolección: ${pedidos.length}`);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Recolecciones");

    worksheet.columns = [
      { header: "Nombre", key: "nombre" },
      { header: "Teléfono", key: "telefono" },
      { header: "Dirección", key: "direccion" },
      { header: "Email", key: "email" },
    ];

    pedidos.forEach((pedido) => {
      worksheet.addRow({
        nombre: pedido.origen?.nombre || "",
        telefono: pedido.origen?.telefono || "",
        direccion: pedido.origen?.direccion || "",
        email: pedido.origen?.email || "",
      });
    });

    const fechaEntrega = obtenerFechaEntregaNombreArchivo();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="SHIP IT! Recolecciones - ${fechaEntrega}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("❌ Error exportando recolecciones:", error);
    res.status(500).json({ error: "Error al generar archivo de recolecciones" });
  }
};

// ✅ ENTREGAS
export const exportarEntregas = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    let pedidos = [];

    if (fechaInicio && fechaFin) {
      const desde = new Date(fechaInicio);
      const hasta = new Date(`${fechaFin}T23:59:59`);
      pedidos = await Pedido.find({ fechaEntregaProgramada: { $gte: desde, $lte: hasta } });
      console.log("📦 Entregas con fechas personalizadas: desde", desde.toISOString(), "hasta", hasta.toISOString());
    } else {
      const { desde: desdeMismoDia, hasta: hastaMismoDia } = obtenerRangoOperativo("mismoDia");
      const { desde: desdeDiaSig, hasta: hastaDiaSig } = obtenerRangoOperativo("diaSiguiente");

      console.log("📦 Entregas Express/Fulfillment: desde", desdeMismoDia.toISOString(), "hasta", hastaMismoDia.toISOString());
      console.log("📦 Entregas Standard: desde", desdeDiaSig.toISOString(), "hasta", hastaDiaSig.toISOString());

      pedidos = await Pedido.find({
        $or: [
          {
            fechaEntregaProgramada: { $gte: desdeMismoDia, $lte: hastaMismoDia },
            "envio.tipo": { $in: ["express", "fulfillment"] },
          },
          {
            fechaEntregaProgramada: { $gte: desdeDiaSig, $lte: hastaDiaSig },
            "envio.tipo": "standard",
          },
        ],
      });
    }

    console.log(`✅ Pedidos encontrados para entrega: ${pedidos.length}`);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Entregas");

    worksheet.columns = [
      { header: "Nombre", key: "nombre" },
      { header: "Teléfono", key: "telefono" },
      { header: "Dirección", key: "direccion" },
      { header: "Comentarios", key: "comentarios" },
      { header: "Email", key: "email" },
      { header: "COD", key: "cod" },
    ];

    pedidos.forEach((pedido) => {
      worksheet.addRow({
        nombre: pedido.destino?.nombre || "",
        telefono: pedido.destino?.telefono || "",
        direccion: pedido.destino?.direccion || "",
        comentarios: pedido.envio?.instrucciones || "",
        email: pedido.destino?.email || "",
        cod: pedido.envio?.cod ? `$${pedido.envio.cod}` : "",
      });
    });

    const fechaEntrega = obtenerFechaEntregaNombreArchivo();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="SHIP IT! Entregas - ${fechaEntrega}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("❌ Error exportando entregas:", error);
    res.status(500).json({ error: "Error al generar archivo de entregas" });
  }
};
