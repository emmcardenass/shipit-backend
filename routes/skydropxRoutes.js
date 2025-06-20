import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

router.post('/cotizar', async (req, res) => {
  try {
    const response = await axios.post(
      'https://api.skydropx.com/v1/shipments',
      {
        address_from: req.body.address_from,
        address_to: req.body.address_to,
        parcels: req.body.parcels,
        shipment: req.body.shipment,
      },
      {
        headers: {
          Authorization: `Token ${process.env.SKYDROPX_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Error al cotizar con Skydropx:', error.response?.data || error.message);
    res.status(500).json({ error: 'Error al cotizar con Skydropx' });
  }
});

export default router;
// Ruta de prueba rápida para Skydropx
router.get('/test', async (req, res) => {
    try {
      const response = await axios.post(
        'https://api.skydropx.com/v1/shipments',
        {
          address_from: {
            province: "Nuevo León",
            city: "Monterrey",
            name: "Emmanuel Cárdenas",
            zip: "64000",
            country: "MX",
            street1: "Calle Ficticia 123"
          },
          address_to: {
            province: "Nuevo León",
            city: "Monterrey",
            name: "Cliente de prueba",
            zip: "64000",
            country: "MX",
            street1: "Calle Imaginaria 456"
          },
          parcels: [
            {
              weight: 1,
              height: 10,
              width: 10,
              length: 10
            }
          ],
          shipment: {
            type: "delivery"
          }
        },
        {
          headers: {
            Authorization: `Token ${process.env.SKYDROPX_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
  
      res.json(response.data);
    } catch (error) {
      console.error('Error en la prueba de Skydropx:', error.response?.data || error.message);
      res.status(500).json({ error: 'Error en la prueba de Skydropx' });
    }
  });
  