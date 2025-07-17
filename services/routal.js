import dotenv from "dotenv";
dotenv.config();

import axios from "axios";

const ROUTAL_BASE_URL = "https://api.routal.com/api";

export const crearEnvioRoutal = async (pedido) => {
  const ROUTAL_API_KEY = process.env.ROUTAL_API_KEY; // 👈 se accede solo dentro de la función
  console.log("🔑 ROUTAL_API_KEY cargada:", ROUTAL_API_KEY);

  try {
    const response = await axios.post(
      `${ROUTAL_BASE_URL}/plans?private_key=${ROUTAL_API_KEY}`,
      {
        name: `Pedido ${pedido.numeroGuia}`,
        stops: [
          {
            name: pedido.envio.remitente,
            address: pedido.origen.direccion,
            phone: pedido.envio.telRemitente,
            notes: "Recolectar paquete",
            type: "pickup"
          },
          {
            name: pedido.destino.nombre,
            address: pedido.destino.direccion,
            phone: pedido.destino.telefono,
            notes: "Entregar paquete",
            type: "delivery"
          }
        ]
      },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error("❌ Error al crear ruta en Routal:", error.response?.data || error.message);
    throw new Error("Error al crear ruta en Routal");
  }
};
