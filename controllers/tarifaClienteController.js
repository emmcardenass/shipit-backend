import TarifaCliente from "../models/TarifaCliente.js";

export const obtenerTarifasCliente = async (req, res) => {
  try {
    const tarifas = await TarifaCliente.find().populate("clienteId");
    res.json(tarifas);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener tarifas personalizadas" });
  }
};

export const crearTarifaCliente = async (req, res) => {
  try {
    const {
      clienteId,
      zona,
      precio,
      tipoServicio,
      pesoMin,
      pesoMax,
      incluyeCOD
    } = req.body;

    if (!clienteId || !zona || !precio || !tipoServicio || !pesoMin || !pesoMax) {
      return res.status(400).json({ mensaje: "Faltan campos requeridos" });
    }

    const nueva = new TarifaCliente({
      clienteId,
      zona,
      precio,
      tipoServicio,
      pesoMin,
      pesoMax,
      incluyeCOD
    });

    await nueva.save();
    res.status(201).json(nueva);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al crear tarifa personalizada" });
  }
};

export const eliminarTarifaCliente = async (req, res) => {
  try {
    await TarifaCliente.findByIdAndDelete(req.params.id);
    res.json({ mensaje: "Eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al eliminar tarifa personalizada" });
  }
};

export const actualizarTarifaCliente = async (req, res) => {
  try {
    const actualizada = await TarifaCliente.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(actualizada);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al actualizar tarifa personalizada" });
  }
};
