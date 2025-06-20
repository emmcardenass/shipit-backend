import express from 'express';
import Driver from '../models/Driver.js';

const router = express.Router();

// Crear nuevo repartidor
router.post('/', async (req, res) => {
  try {
    const { nombre, telefono, correo, zona, estatus } = req.body;

    if (!nombre || !telefono || !correo) {
      return res.status(400).json({ message: 'Nombre, teléfono y correo son obligatorios' });
    }

    const nuevoDriver = new Driver({
      nombre: nombre.trim(),
      telefono: telefono.trim(),
      correo: correo.trim(),
      zona: zona ? zona.trim() : '',
      estatus: estatus || 'activo'
    });

    const driverGuardado = await nuevoDriver.save();
    res.status(201).json(driverGuardado);
  } catch (error) {
    console.error('Error creando driver:', error);
    res.status(500).json({ message: 'Error al crear repartidor' });
  }
});

// Obtener todos los repartidores
router.get('/', async (req, res) => {
  try {
    const drivers = await Driver.find();
    res.json(drivers);
  } catch (error) {
    console.error('Error listando drivers:', error);
    res.status(500).json({ message: 'Error al obtener repartidores' });
  }
});

// Obtener repartidor individual
router.get('/:id', async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ message: 'Repartidor no encontrado' });
    }
    res.json(driver);
  } catch (error) {
    console.error('Error buscando driver:', error);
    res.status(500).json({ message: 'Error al buscar repartidor' });
  }
});

// Actualizar repartidor
router.put('/:id', async (req, res) => {
  try {
    const driverActualizado = await Driver.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!driverActualizado) {
      return res.status(404).json({ message: 'Repartidor no encontrado' });
    }
    res.json(driverActualizado);
  } catch (error) {
    console.error('Error actualizando driver:', error);
    res.status(500).json({ message: 'Error al actualizar repartidor' });
  }
});

// Eliminar repartidor
router.delete('/:id', async (req, res) => {
  try {
    const driverEliminado = await Driver.findByIdAndDelete(req.params.id);
    if (!driverEliminado) {
      return res.status(404).json({ message: 'Repartidor no encontrado' });
    }
    res.json({ message: 'Repartidor eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando driver:', error);
    res.status(500).json({ message: 'Error al eliminar repartidor' });
  }
});

export default router;
