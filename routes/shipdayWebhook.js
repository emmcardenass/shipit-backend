import express from "express";
import dotenv from "dotenv";
import Order from "../models/Order.js";

dotenv.config();

const router = express.Router();

const traducirEstado = (estadoShipday) => {
  switch (estadoShipday) {
    case "CREATED":
      return "creado";
    case "ASSIGNED":
      return "creado"; // Solo asignado, no recolectado todavía
    case "OUT_FOR_DELIVERY":
      return "en_camino";
    case "DELIVERED":
      return "entregado";
    case "FAILED":
      return "reagendado";
    case "RESCHEDULED":
      return "reagendado";
    default:
      return "creado";
  }
};

router.post("/webhook", async (req, res) => {
  const token = req.headers["shipday-webhook-token"];

  console.log("🔒 Token recibido:", token);
console.log("🔑 Token esperado:", process.env.SHIPDAY_WEBHOOK_TOKEN);

  if (token !== process.env.SHIPDAY_WEBHOOK_TOKEN) {
    console.log("❌ Token inválido en Webhook Shipday");
    return res.status(403).json({ success: false, message: "Token inválido" });
  }

  console.log("📩 Webhook recibido:", req.body);

  const { orderId, status } = req.body;

  if (!orderId || !status) {
    console.log("⚠️ Faltan datos en el Webhook");
    return res.status(400).json({ success: false, message: "Faltan datos requeridos" });
  }

  try {
    const pedido = await Order.findOne({ "envio.numeroGuia": orderId });

    if (!pedido) {
      console.log(`⚠️ Pedido no encontrado: ${orderId}`);
      return res.status(404).json({ success: false, message: "Pedido no encontrado" });
    }

    const nuevoEstado = traducirEstado(status);
    pedido.envio.estado = nuevoEstado;
    await pedido.save();

    console.log(`✅ Pedido ${orderId} actualizado a estado: ${nuevoEstado}`);
    res.json({ success: true });
  } catch (error) {
    console.error("🚨 Error actualizando pedido:", error);
    res.status(500).json({ success: false, message: "Error interno" });
  }
});

export default router;
