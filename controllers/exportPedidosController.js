// backend/controllers/exportPedidosController.js
import Pedido from "../models/Order.js";
import ExcelJS from "exceljs";

const zonaHorariaMX = "America/Monterrey";

function obtenerRango(fechaReferencia, tipo) {
  const base = new Date(fechaReferencia);
  base.setHours(9, 0, 0, 0);

  let desde, hasta;
  if (tipo === "recolecciones" || tipo === "mismoDia") {
    desde = new Date(base.getTime() - 86400000 + 1000); // ayer 9:00:01am
    hasta = new Date(base.getTime()); // hoy 9:00:00am
  } else if (tipo === "diaSiguiente") {
    desde = new Date(base.getTime() - 2 * 86400000 + 1000); // antier 9:00:01am
    hasta = new Date(base.getTime() - 86400000); // ayer 9:00:00am
  }

  return { desde, hasta };
}

export const exportarRecolecciones = async (req, res) => {
  try {
    const { desde, hasta } = obtenerRango(Date.now(), "recolecciones");

    const pedidos = await Pedido.find({
      createdAt: { $gte: desde, $lte: hasta },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Recolecciones");

    worksheet.columns = [
      { header: "ID", key: "id" },
      { header: "Dirección", key: "direccion" },
      { header: "Cliente", key: "cliente" },
      { header: "Teléfono", key: "telefono" },
      { header: "Notas", key: "notas" },
      { header: "Prioridad", key: "prioridad" },
      { header: "Hora inicio", key: "horaInicio" },
      { header: "Hora fin", key: "horaFin" },
      { header: "COD", key: "cod" },
    ];

    pedidos.forEach((pedido, index) => {
      worksheet.addRow({
        id: index + 1,
        direccion: pedido.origen?.direccion || "",
        cliente: pedido.origen?.nombre || "",
        telefono: pedido.origen?.telefono || "",
        notas: pedido.origen?.referencia || "",
        prioridad: "",
        horaInicio: "",
        horaFin: "",
        cod: "",
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=recolecciones.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("❌ Error exportando recolecciones:", error);
    res.status(500).json({ error: "Error al generar archivo de recolecciones" });
  }
};

export const exportarEntregas = async (req, res) => {
  try {
    const hoy = Date.now();

    const { desde: desdeMismoDia, hasta: hastaMismoDia } = obtenerRango(hoy, "mismoDia");
    const { desde: desdeDiaSig, hasta: hastaDiaSig } = obtenerRango(hoy, "diaSiguiente");

    const pedidos = await Pedido.find({
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

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Entregas");

    worksheet.columns = [
      { header: "ID", key: "id" },
      { header: "Dirección", key: "direccion" },
      { header: "Cliente", key: "cliente" },
      { header: "Teléfono", key: "telefono" },
      { header: "Notas", key: "notas" },
      { header: "Prioridad", key: "prioridad" },
      { header: "Hora inicio", key: "horaInicio" },
      { header: "Hora fin", key: "horaFin" },
      { header: "COD", key: "cod" },
    ];

    pedidos.forEach((pedido, index) => {
      worksheet.addRow({
        id: index + 1,
        direccion: pedido.destino?.direccion || "",
        cliente: pedido.destino?.nombre || "",
        telefono: pedido.destino?.telefono || "",
        notas: pedido.destino?.referencia || "",
        prioridad: "",
        horaInicio: "",
        horaFin: "",
        cod: pedido.envio?.cod ? `$${pedido.envio.cod}` : "",
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=entregas.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("❌ Error exportando entregas:", error);
    res.status(500).json({ error: "Error al generar archivo de entregas" });
  }
};
