import Pedido from "../models/Order.js";

export const recibirWebhookRoutal = async (req, res) => {
  try {
    const { numeroGuia, estado } = req.body;

    if (!numeroGuia || !estado) {
      return res.status(400).json({ error: "Faltan datos necesarios" });
    }

    const pedido = await Pedido.findOne({ "envio.numeroGuia": numeroGuia });

    if (!pedido) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    pedido.estado = estado;
    await pedido.save();

    res.status(200).json({ message: "Estado actualizado correctamente" });
  } catch (error) {
    console.error("❌ Error al procesar webhook Routal:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
