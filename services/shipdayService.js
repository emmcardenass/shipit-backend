import dotenv from 'dotenv';
dotenv.config();

import fetch from 'node-fetch';

const SHIPDAY_API_URL = 'https://api.shipday.com';

export const crearEnvioShipday = async (pedido) => {
  const apiKey = process.env.SHIPDAY_API_KEY;

  if (!apiKey) {
    console.error("❌ SHIPDAY_API_KEY no está definida. Revisa tu archivo .env");
    throw new Error("API Key de Shipday no encontrada");
  }

  // Reemplaza itemType por algo estandarizado según la documentación
  const tipoItem = "package"; // O puede ser 'food', 'medicine', etc., según tu lógica de negocio

  const payload = {
    restaurant: {
      name: "SHIP IT",
      phone: "+52" + (pedido.origen.telefono || "8110158436"),
      address: pedido.origen.direccion,
      latitude: parseFloat(pedido.origen.coordenadas[1]),
      longitude: parseFloat(pedido.origen.coordenadas[0]),
    },
    customer: {
      name: pedido.destino.nombre,
      phone: "+52" + (pedido.destino.telefono || "0000000000"),
      address: pedido.destino.direccion,
      latitude: parseFloat(pedido.destino.coordenadas[1]),
      longitude: parseFloat(pedido.destino.coordenadas[0]),
      email: pedido.destino.email || "sinemail@shipit.com",
    },
    orderNumber: pedido.envio.numeroGuia,
    itemType: tipoItem,
    deliveryTime: new Date(pedido.fechaEntregaProgramada).toISOString(),
    pickupReadyTime: new Date(pedido.fechaRecoleccionProgramada).toISOString(),
    codAmount: pedido.envio.tipoPago === 'COD' ? parseFloat(pedido.envio.cod || 0) : 0,
    requiresProofOfDelivery: true,
    hasPickup: true,
    hasDelivery: true,
  };

  console.log("📦 Payload Shipday:", JSON.stringify(payload, null, 2));
  console.log("🔐 API KEY usada para Shipday:", apiKey);

  try {
    const response = await fetch(`${SHIPDAY_API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.text();

    if (!response.ok) {
      console.error("❌ Error al crear pedido en Shipday:", data);
      throw new Error("Error al crear pedido en Shipday");
    }

    console.log("🚀 Pedido enviado a Shipday:", data);
    return JSON.parse(data);

  } catch (error) {
    console.error("❌ Error de conexión con Shipday:", error.message);
    throw new Error("Fallo en la integración con Shipday");
  }
};
