// controllers/walletController.js
import User from "../models/User.js";

export const getWalletData = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const transacciones = (user.transacciones || []).map((t) => ({
      ...t,
      fechaCompleta: new Date(t.fecha).toLocaleString("es-MX", {
        dateStyle: "short",
        timeStyle: "short",
        hour12: false,
      }),
    })).reverse();

    res.json({
      balance: user.balance || 0,
      saldo: user.saldoEnvios || 0,
      transacciones,
    });
  } catch (err) {
    res.status(500).json({ message: "Error al obtener datos de la billetera" });
  }
};

export const migrateToSaldo = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || user.balance <= 0)
      return res.status(400).json({ message: "Sin balance suficiente" });

    const { monto } = req.body;
    const cantidad = parseFloat(monto);

    if (isNaN(cantidad) || cantidad <= 0)
      return res.status(400).json({ message: "Monto inválido" });

    if (cantidad > user.balance)
      return res.status(400).json({ message: "Monto mayor al balance disponible" });

    user.balance -= cantidad;
    user.saldoEnvios = (user.saldoEnvios || 0) + cantidad;
    user.transacciones = [
      ...(user.transacciones || []),
      { fecha: new Date(), tipo: "Migración a saldo de envíos", monto: -cantidad },
    ];

    await user.save();
    res.json({ message: "Migración exitosa" });
  } catch (err) {
    res.status(500).json({ message: "Error al migrar saldo" });
  }
};

export const solicitarRetiro = async (req, res) => {
  const { metodo, monto } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user || user.balance < monto)
      return res.status(400).json({ message: "Saldo insuficiente" });

    const metodoFormateado =
      metodo === "deposito" ? "depósito" :
      metodo === "efectivo" ? "efectivo" :
      metodo;

    user.balance -= monto;
    user.transacciones = [
      ...(user.transacciones || []),
      { 
        fecha: new Date(), 
        tipo: metodo === "deposito"
          ? "Retiro solicitado (depósito)"
          : metodo === "efectivo"
          ? "Retiro solicitado (efectivo)"
          : `Retiro solicitado (${metodo})`,
        monto: -monto 
      },      
    ];

    await user.save();
    res.json({ message: "Retiro solicitado correctamente" });
  } catch (err) {
    res.status(500).json({ message: "Error al solicitar retiro" });
  }
};
