import Order from "../models/Order.js";

export const recibirWebhookShipday = async (req, res) => {
  const tokenHeader = req.headers["x-shipday-token"];
  const expectedToken = process.env.SHIPDAY_WEBHOOK_TOKEN;

  if (tokenHeader !== expectedToken) {
    return res.status(403).json({ mensaje: "Token inválido" });
  }

  const evento = req.body;
  console.log("📦 Webhook recibido:", evento);

  try {
    const { order_number, status } = evento;

    const estadoTraducido = {
      ASSIGNED: "asignado",
      STARTED: "en ruta",
      COMPLETED: "entregado",
      FAILED: "fallido"
    }[status] || "pendiente";

    const pedido = await Order.findOneAndUpdate(
      { guia: order_number },
      { estado: estadoTraducido },
      { new: true }
    );

    if (!pedido) {
      console.warn("⚠️ No se encontró pedido con guía:", order_number);
    }

    res.status(200).json({ mensaje: "Estado actualizado" });
  } catch (error) {
    console.error("❌ Error procesando webhook:", error);
    res.status(500).json({ mensaje: "Error interno" });
  }
};
