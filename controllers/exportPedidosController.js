// backend/controllers/exportPedidosController.js
import Pedido from "../models/Order.js";
import ExcelJS from "exceljs";

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

// 👉 Utilidad para formatear nombre del archivo
function obtenerFechaEntregaNombreArchivo(fechaBase = Date.now()) {
  const fechaEntrega = new Date(fechaBase + 86400000); // entrega es "mañana"
  return fechaEntrega.toLocaleDateString("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).replaceAll("/", "-");
}

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
  
      const fechaEntrega = obtenerFechaEntregaNombreArchivo();
  
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="SHIP IT! Ruta Recolecciones - ${fechaEntrega}.xlsx"`
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
      const { fechaInicio, fechaFin } = req.query;
  
      let pedidos = [];
  
      if (fechaInicio && fechaFin) {
        const desde = new Date(fechaInicio);
        const hasta = new Date(`${fechaFin}T23:59:59`);
        pedidos = await Pedido.find({
          createdAt: { $gte: desde, $lte: hasta },
        });
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
  
      const fechaEntrega = obtenerFechaEntregaNombreArchivo();
  
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="SHIP IT! Ruta Entregas - ${fechaEntrega}.xlsx"`
      );
  
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error("❌ Error exportando entregas:", error);
      res.status(500).json({ error: "Error al generar archivo de entregas" });
    }
  };
  