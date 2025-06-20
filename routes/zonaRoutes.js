// backend/routes/zonaRoutes.js
import express from 'express';
import Zona from '../models/Zona.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Obtener todas las zonas
router.get('/', authMiddleware, async (req, res) => {
  try {
    const zonas = await Zona.find().populate('tarifasAsociadas');
    res.json(zonas);
  } catch (error) {
    console.error('Error al obtener zonas:', error);
    res.status(500).json({ message: 'Error al obtener zonas' });
  }
});

// Crear una nueva zona
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { nombre, poligono } = req.body;

    const nuevaZona = new Zona({
      nombre,
      poligono,
      tarifasAsociadas: [],
    });

    const zonaGuardada = await nuevaZona.save();
    res.status(201).json(zonaGuardada);
  } catch (error) {
    console.error('Error al crear zona:', error);
    res.status(500).json({ message: 'Error al crear zona' });
  }
});

// Eliminar una zona
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await Zona.findByIdAndDelete(req.params.id);
    res.json({ message: 'Zona eliminada' });
  } catch (error) {
    console.error('Error al eliminar zona:', error);
    res.status(500).json({ message: 'Error al eliminar zona' });
  }
});

export default router;
