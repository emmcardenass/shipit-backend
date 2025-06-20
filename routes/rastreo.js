// backend/routes/rastreo.js
import express from 'express';
import Order from '../models/Order.js';
const router = express.Router();

// GET /api/rastreo/:guia
router.get('/:guia', async (req, res) => {
  try {
    const guia = req.params.guia;
    const envio = await Order.findById(guia);

    if (!envio) return res.status(404).json({ message: 'Guía no encontrada' });

    res.json(envio);
  } catch (error) {
    console.error('Error en rastreo:', error);
    res.status(500).json({ message: 'Error al buscar la guía' });
  }
});

export default router;
