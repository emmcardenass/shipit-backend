// backend/services/skydropxService.js
import axios from 'axios';

let bearerToken = null;
let tokenExpiration = null;

// Función para pedir un nuevo token a Skydropx
async function fetchBearerToken() {
  try {
    const response = await axios.post('https://api.skydropx.com/v1/oauth/token', {
      client_id: process.env.SKYDROPX_API_KEY,
      client_secret: process.env.SKYDROPX_API_SECRET,
      grant_type: 'client_credentials',
      redirect_uri: 'urn:ietf:wg:oauth:2.0:oob',
      scope: 'default orders.create'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    bearerToken = response.data.access_token;
    tokenExpiration = Date.now() + (response.data.expires_in * 1000) - (5 * 60 * 1000); // 5 minutos de margen

    console.log('✅ Nuevo token Bearer obtenido correctamente.');
    return bearerToken;
  } catch (error) {
    console.error('❌ Error al obtener el Bearer Token de Skydropx:', error.response?.data || error.message);
    throw new Error('No se pudo obtener el Bearer Token de Skydropx');
  }
}

// Función para asegurarse de que siempre tenemos un token válido
async function getValidBearerToken() {
  if (!bearerToken || Date.now() > tokenExpiration) {
    console.log('🔄 Bearer Token expirado o inexistente. Solicitando uno nuevo...');
    return await fetchBearerToken();
  }
  return bearerToken;
}

// Función para cotizar envíos
export async function cotizarConSkydropx(datosCotizacion) {
  try {
    const token = await getValidBearerToken();

    const response = await axios.post('https://api.skydropx.com/v1/quotations', datosCotizacion, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      }
    });

    console.log('✅ Cotización enviada correctamente a Skydropx.');
    return response.data;
  } catch (error) {
    console.error('❌ Error al cotizar en Skydropx:', error.response?.data || error.message);
    throw new Error('Error al cotizar en Skydropx');
  }
}
