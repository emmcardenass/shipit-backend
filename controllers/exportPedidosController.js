import Pedido from "../models/Order.js";
import ExcelJS from "exceljs";

function obtenerRango(fechaReferencia, tipo) {
  const base = new Date(fechaReferencia);
  base.setHours(9, 0, 0, 0);

  let desde, hasta;
  if (tipo === "recolecciones" || tipo === "mismoDia") {
    desde = new Date(base.getTime() - 86400000 + 1000);
    hasta = new Date(base.getTime());
  } else if (tipo === "diaSiguiente") {
    desde = new Date(base.getTime() - 2 * 86400000 + 1000);
    hasta = new Date(base.getTime() - 86400000);
  }

  return { desde, hasta };
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
      const rango = obtenerRango(Date.now(), "recolecciones");
      desde = rango.desde;
      hasta = rango.hasta;
    }

    const pedidos = await Pedido.find({ createdAt: { $gte: desde, $lte: hasta } });

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
      pedidos = await Pedido.find({ createdAt: { $gte: desde, $lte: hasta } });
    } else {
      const hoy = Date.now();
      const { desde: desdeMismoDia, hasta: hastaMismoDia } = obtenerRango(hoy, "mismoDia");
      const { desde: desdeDiaSig, hasta: hastaDiaSig } = obtenerRango(hoy, "diaSiguiente");

      pedidos = await Pedido.find({
        $or: [
          {
            createdAt: { $gte: desdeMismoDia, $lte: hastaMismoDia },
            "envio.tipo": { $in: ["express", "fulfillment"] },
          },
          {
            createdAt: { $gte: desdeDiaSig, $lte: hastaDiaSig },
            "envio.tipo": "standard",
          },
        ],
      });
    }

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
