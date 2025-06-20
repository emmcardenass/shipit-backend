import dotenv from 'dotenv';
dotenv.config();

import fetch from 'node-fetch';

const SHIPDAY_API_URL = 'https://api.shipday.com';

export const crearEnvioShipday = async (pedido) => {
  const apiKey = process.env.SHIPDAY_API_KEY;

  // Verificar que la API Key exista
  if (!apiKey) {
    console.error("❌ SHIPDAY_API_KEY no está definida. Revisa tu archivo .env");
    throw new Error("API Key de Shipday no encontrada");
  }

  const payload = {
    restaurant: {
      name: "SHIP IT",
      phone: pedido.origen.telefono,
      address: pedido.origen.direccion,
      latitude: pedido.origen.coordenadas[1],  // latitud
      longitude: pedido.origen.coordenadas[0], // longitud
    },
    customer: {
      name: pedido.destino.nombre,
      phone: pedido.destino.telefono,
      address: pedido.destino.direccion,
      latitude: pedido.destino.coordenadas[1],
      longitude: pedido.destino.coordenadas[0],
    },
    orderNumber: pedido.envio.numeroGuia,
    itemType: pedido.envio.contenido,
    deliveryTime: pedido.fechaEntregaProgramada,
    pickupReadyTime: pedido.fechaRecoleccionProgramada,
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
