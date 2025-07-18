import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const ROUTAL_API_KEY = process.env.ROUTAL_API_KEY;
const ROUTAL_BASE_URL = "https://api.routal.com/api/v2";

export const crearEnvioRoutal = async (pedido) => {
  try {
    const response = await axios.post(
      `${ROUTAL_BASE_URL}/stops`,
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
          Authorization: `Bearer ${ROUTAL_API_KEY}`,
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
