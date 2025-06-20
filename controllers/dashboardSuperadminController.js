// backend/controllers/dashboardSuperadminController.js
import Order from "../models/Order.js";
import User from "../models/User.js";

export const obtenerEstadisticas = async (req, res) => {
  try {
    const hoy = new Date();
    const inicioHoy = new Date(hoy.setHours(0, 0, 0, 0));
    const inicioSemana = new Date(hoy.setDate(hoy.getDate() - hoy.getDay()));
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    const pedidos = await Order.find({});

    const pedidosHoy = pedidos.filter(p => new Date(p.createdAt) >= inicioHoy).length;
    const pedidosSemana = pedidos.filter(p => new Date(p.createdAt) >= inicioSemana).length;
    const pedidosMes = pedidos.filter(p => new Date(p.createdAt) >= inicioMes).length;

    const enviados = pedidos.filter(p => p.estado === "en camino").length;
    const entregados = pedidos.filter(p => p.estado === "entregado").length;
    const retrasados = pedidos.filter(p => p.estado === "retrasado").length;

    const facturadoHoy = pedidos
      .filter(p => new Date(p.createdAt) >= inicioHoy)
      .reduce((acc, p) => acc + (p.valorCOD || 0), 0);

    const facturadoMes = pedidos
      .filter(p => new Date(p.createdAt) >= inicioMes)
      .reduce((acc, p) => acc + (p.valorCOD || 0), 0);

    const repartidoresActivos = await User.countDocuments({ role: "repartidor" });

    // Agrupar por zona
    const zonas = {};
    pedidos.forEach(p => {
      const zona = p?.destino?.zona || "Sin zona";
      zonas[zona] = (zonas[zona] || 0) + 1;
    });

    const zonasSaturadas = Object.entries(zonas)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([zona]) => zona);

    // Alertas inteligentes
    const pedidosSinAsignar = pedidos.filter(p => !p.repartidorAsignado).length;
    const pedidosRetrasados = pedidos.filter(p => p.estado === "retrasado").length;

    const alertas = [];
    if (pedidosSinAsignar > 0) alertas.push(`${pedidosSinAsignar} pedidos sin asignar`);
    if (pedidosRetrasados > 0) alertas.push(`${pedidosRetrasados} pedidos retrasados`);
    if (zonasSaturadas.includes("Sin zona")) alertas.push("Algunos pedidos no tienen zona definida");

    res.json({
      pedidosHoy,
      pedidosSemana,
      pedidosMes,
      enviados,
      entregados,
      retrasados,
      facturadoHoy,
      facturadoMes,
      repartidoresActivos,
      zonasSaturadas,
      alertas
    });
  } catch (error) {
    console.error("❌ Error en estadísticas superadmin:", error);
    res.status(500).json({ message: "Error al obtener estadísticas" });
  }
};

export const obtenerPedidosConCoordenadas = async (req, res) => {
    try {
      const hace7Dias = new Date();
      hace7Dias.setDate(hace7Dias.getDate() - 7);
  
      const pedidos = await Order.find({
        createdAt: { $gte: hace7Dias },
        "destino.coordenadas": { $exists: true, $size: 2 }
      }, "envio.numeroGuia estado destino.coordenadas").lean();
  
      const resultado = pedidos.map(p => ({
        guia: p.envio?.numeroGuia || "Sin guía",
        estado: p.estado,
        coordenadas: p.destino.coordenadas // 👈 Ya están bien ordenadas: [long, lat]
      }));
  
      res.json(resultado);
    } catch (err) {
      console.error("❌ Error al obtener pedidos para el mapa:", err);
      res.status(500).json({ message: "Error al obtener pedidos con coordenadas" });
    }
  };
  
  