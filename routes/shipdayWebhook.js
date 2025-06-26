import express from "express";
import dotenv from "dotenv";
import Order from "../models/Order.js";

dotenv.config();

const router = express.Router();

router.post("/webhook", async (req, res) => {
  const token = req.headers["shipday-webhook-token"];

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

    pedido.envio.estado = status;
    await pedido.save();

    console.log(`✅ Pedido ${orderId} actualizado a estado: ${status}`);
    res.json({ success: true });
  } catch (error) {
    console.error("🚨 Error actualizando pedido:", error);
    res.status(500).json({ success: false, message: "Error interno" });
  }
});

export default router;
