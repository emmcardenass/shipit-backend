import Order from "../models/Order.js";

export const recibirWebhookRoutal = async (req, res) => {
  try {
    const evento = req.body.event;
    const datos = req.body.data;

    console.log("📥 Webhook recibido:", evento);
    console.log("🧾 Datos:", JSON.stringify(datos, null, 2));

    // Suponemos que usas un campo como 'numeroGuia' o 'externalId' para relacionar
    const numeroGuia = datos?.external_id || datos?.stop?.external_id;

    if (!numeroGuia) {
      return res.status(400).json({ mensaje: "No se proporcionó external_id" });
    }

    // Buscar el pedido por número de guía
    const pedido = await Order.findOne({ "envio.numeroGuia": numeroGuia });

    if (!pedido) {
      return res.status(404).json({ mensaje: "Pedido no encontrado" });
    }

    // Mapeo de eventos a estados internos
    const estados = {
      "Driver started": "En ruta",
      "Driver finished": "Ruta finalizada",
      "Stop reported": datos?.stop?.status === "DELIVERED" ? "Entregado" :
                       datos?.stop?.status === "PICKED_UP" ? "Recolectado" :
                       datos?.stop?.status === "FAILED" ? "Fallido" :
                       "En proceso"
    };

    const nuevoEstado = estados[evento];

    // Actualizar el estado si lo reconocemos
    if (nuevoEstado) {
      pedido.estado = nuevoEstado;
      await pedido.save();
      console.log(`✅ Pedido ${numeroGuia} actualizado a: ${nuevoEstado}`);
    } else {
      console.warn(`⚠️ Evento recibido sin mapeo válido: ${evento}`);
    }

    res.status(200).json({ mensaje: "Webhook recibido" });

  } catch (error) {
    console.error("❌ Error procesando webhook de Routal:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};
