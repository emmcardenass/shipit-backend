// backend/routes/clientesRoutes.js
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import ClienteFrecuente from "../models/ClienteFrecuente.js";

const router = express.Router();

// 🔐 Obtener todos los clientes frecuentes del usuario autenticado
router.get("/", authMiddleware, async (req, res) => {
  try {
    const clientes = await ClienteFrecuente.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(clientes);
  } catch (err) {
    console.error("Error al obtener clientes frecuentes:", err);
    res.status(500).json({ message: "Error al obtener clientes frecuentes" });
  }
});

// ➕ Agregar nuevo cliente frecuente
router.post("/", authMiddleware, async (req, res) => {
  try {
    let { nombre, telefono, direccion, email, notas, coordenadas } = req.body;

    // ✅ Si dirección es un objeto con .direccion, extraer el string plano
    if (typeof direccion === "object" && direccion.direccion) {
      direccion = direccion.direccion;
    }

    if (!nombre || !telefono || !direccion) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    // 🚨 Verificar si ya existe un cliente frecuente con ese teléfono para ese userId
    const existeCliente = await ClienteFrecuente.findOne({
      userId: req.user._id,
      telefono
    });

    if (existeCliente) {
      return res.status(400).json({ message: "Ya tienes un cliente frecuente con este número" });
    }

    const nuevoCliente = new ClienteFrecuente({
      userId: req.user._id,
      nombre,
      telefono,
      direccion,
      email,
      notas,
      coordenadas // ✅ ahora también se guardan las coordenadas
    });

    await nuevoCliente.save();
    res.json(nuevoCliente);
  } catch (err) {
    console.error("Error al crear cliente frecuente:", err);
    res.status(500).json({ message: "Error al guardar cliente" });
  }
});

// ✏️ Editar cliente frecuente
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const cliente = await ClienteFrecuente.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    if (!cliente) return res.status(404).json({ message: "Cliente no encontrado" });
    res.json(cliente);
  } catch (err) {
    console.error("Error al editar cliente:", err);
    res.status(500).json({ message: "Error al editar cliente" });
  }
});

// 🗑️ Eliminar cliente frecuente
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const eliminado = await ClienteFrecuente.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });
    if (!eliminado) return res.status(404).json({ message: "Cliente no encontrado" });
    res.json({ message: "Cliente eliminado" });
  } catch (err) {
    console.error("Error al eliminar cliente:", err);
    res.status(500).json({ message: "Error al eliminar cliente" });
  }
});

export default router;
