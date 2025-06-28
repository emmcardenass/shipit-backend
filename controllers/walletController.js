import User from "../models/User.js";
import mongoose from "mongoose";

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
  const { metodo, monto, banco, clabe, bancoOtro } = req.body;
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
        monto: -monto,
        banco: banco || "",
        bancoOtro: bancoOtro || "",
        clabe: clabe || "",
      },      
    ];

    await user.save();
    res.json({ message: "Retiro solicitado correctamente" });
  } catch (err) {
    res.status(500).json({ message: "Error al solicitar retiro" });
  }
};

export const agregarSaldo = async (req, res) => {
  const { metodo, monto, banco, clabe, bancoOtro } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const metodoFormateado =
  metodo === "spei" ? "Transferencia SPEI" :
  metodo === "tarjeta" ? "Tarjeta de crédito o débito" :
  metodo;

    user.transacciones = [
      ...(user.transacciones || []),
      {
        _id: new mongoose.Types.ObjectId(),
        fecha: new Date(),
        tipo: `Solicitud de recarga (${metodoFormateado})`,
        monto: parseFloat(monto),
        banco: banco || "",
        bancoOtro: bancoOtro || "",
        clabe: clabe || "",
        aprobado: false,
      },
    ];

    console.log("✅ Recarga recibida:", {
      metodo: metodoFormateado, banco, bancoOtro, clabe
    });

    await user.save();
    res.json({ message: "Solicitud de recarga enviada correctamente" });
  } catch (err) {
    console.error("❌ Error interno al solicitar recarga:", err);  // IMPRIME EL ERROR REAL
    res.status(500).json({ message: "Error al solicitar recarga" });
  }  
};

export const getSolicitudesRecarga = async (req, res) => {
  try {
    const usuarios = await User.find({}, "nombre email transacciones");

    const solicitudes = usuarios.flatMap((u) =>
      (u.transacciones || [])
        .filter((t) => t.tipo?.toLowerCase().includes("solicitud de recarga"))
        .map((t) => ({
          userId: u._id,
          transaccionId: t._id,
          usuario: u.nombre || "Sin nombre",
          email: u.email,
          monto: t.monto,
          metodo: t.tipo?.includes("Solicitud de recarga (")
            ? t.tipo.replace("Solicitud de recarga (", "").replace(")", "")
            : t.tipo || "",
          banco: t.banco || "",
          bancoOtro: t.bancoOtro || "",
          clabe: t.clabe || "",
          aprobado: t.aprobado || false,
          fecha: new Date(t.fecha).toLocaleString("es-MX", {
            dateStyle: "short",
            timeStyle: "short",
            hour12: false,
          }),
        }))
    );

    res.json(solicitudes.reverse());
  } catch (err) {
    res.status(500).json({ message: "Error al obtener solicitudes" });
  }
};

export const aprobarRecarga = async (req, res) => {
  const { userId, transaccionId } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const transaccion = (user.transacciones || []).find(t => t._id == transaccionId);
    if (!transaccion) return res.status(404).json({ message: "Transacción no encontrada" });

    transaccion.aprobado = true;
    user.saldoEnvios = (user.saldoEnvios || 0) + transaccion.monto;

    await user.save();
    res.json({ message: "Recarga aprobada y saldo agregado" });
  } catch (err) {
    res.status(500).json({ message: "Error al aprobar recarga" });
  }
};

export const rechazarRecarga = async (req, res) => {
  const { userId, transaccionId } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    user.transacciones = (user.transacciones || []).filter(t => t._id != transaccionId);

    await user.save();
    res.json({ message: "Solicitud de recarga rechazada y eliminada" });
  } catch (err) {
    res.status(500).json({ message: "Error al rechazar recarga" });
  }
};

export const editarRecarga = async (req, res) => {
  const { userId, transaccionId, monto, banco, bancoOtro, clabe } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const transaccion = (user.transacciones || []).find(t => t._id == transaccionId);
    if (!transaccion) return res.status(404).json({ message: "Transacción no encontrada" });

    transaccion.monto = parseFloat(monto) || transaccion.monto;
    transaccion.banco = banco || transaccion.banco;
    transaccion.bancoOtro = bancoOtro || transaccion.bancoOtro;
    transaccion.clabe = clabe || transaccion.clabe;

    await user.save();
    res.json({ message: "Solicitud de recarga actualizada correctamente" });
  } catch (err) {
    res.status(500).json({ message: "Error al editar recarga" });
  }
};
