import express from 'express';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import authMiddleware from '../middleware/authMiddleware.js';
import cloudinary from '../config/cloudinary.js';
import Order from '../models/Order.js'; // Asegúrate de tener esto arriba

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, telefono, direccion, estimadoEnvios } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    const newUser = new User({
      name,
      email,
      password,
      telefono,
      direccion,
      estimadoEnvios,
      role: "cliente"
    });

    await newUser.save();

    res.status(201).json({
      token: generateToken(newUser),
      role: newUser.role,
      name: newUser.name,
      foto: newUser.foto || ""
    });
  } catch (error) {
    console.error("❌ Error registrando usuario:", error);
    res.status(500).json({ message: "Error interno al registrar usuario" });
  }
});

// 🔐 Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const isMatch = await user.matchPassword(password);
    console.log("=== DIAGNÓSTICO DE LOGIN ===");
console.log("Email ingresado:", email);
console.log("Password ingresado:", password);
console.log("Password en DB:", user.password);
console.log("¿Coincide?", isMatch);
console.log("Rol del usuario:", user.role);

    if (!isMatch) return res.status(401).json({ message: "Contraseña incorrecta" });

    res.json({
      token: generateToken(user),
      role: user.role,
      name: user.name,
      foto: user.foto || "" // 👈 Importante: enviamos la foto actual (vacía si no hay)
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});


router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      telefono: user.telefono,
      direccion: user.direccion,
      foto: user.foto || "",
      saldo: user.saldoEnvios || 0
    });    
  } catch (err) {
    console.error("❌ Error al obtener perfil:", err);
    res.status(500).json({ message: "Error al obtener perfil" });
  }
});

router.patch("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const fields = ["name", "telefono", "direccion", "estimadoEnvios"];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) user[field] = req.body[field];
    });

    await user.save();
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      telefono: user.telefono,
      direccion: user.direccion,
      foto: user.foto || "",
      saldo: user.saldoEnvios || 0
    });    
  } catch (err) {
    res.status(500).json({ message: "Error al actualizar perfil" });
  }
});

router.patch("/foto", authMiddleware, async (req, res) => {
  try {
    const { fotoBase64 } = req.body;
    if (!fotoBase64) return res.status(400).json({ message: "No se envió la imagen" });

    const result = await cloudinary.uploader.upload(fotoBase64, {
      folder: "shipit-perfiles",
      transformation: [{ width: 300, height: 300, crop: "fill" }]
    });

    const user = await User.findById(req.user._id);
    user.foto = result.secure_url;
    await user.save();

    res.json({ foto: user.foto });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al subir foto" });
  }
});

router.patch("/email", authMiddleware, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Correo requerido" });

    const emailExistente = await User.findOne({ email });
    if (emailExistente) return res.status(400).json({ message: "Correo ya en uso" });

    const user = await User.findById(req.user._id);
    user.email = email;
    await user.save();

    res.json({ message: "Correo actualizado" });
  } catch (err) {
    res.status(500).json({ message: "Error al cambiar correo" });
  }
});

router.patch("/password", authMiddleware, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Contraseña inválida" });
    }
    const user = await User.findById(req.user._id);
    user.password = password;
    await user.save();
    res.json({ message: "Contraseña actualizada" });
  } catch (err) {
    res.status(500).json({ message: "Error al cambiar contraseña" });
  }
});

// 💳 Obtener billetera del usuario logueado
router.get("/wallet", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    res.json({
      balance: user.balance || 0,
      saldo: user.saldoEnvios || 0,
      transacciones: user.transacciones || []
    });
  } catch (err) {
    console.error("❌ Error al obtener billetera:", err);
    res.status(500).json({ message: "Error al obtener billetera" });
  }
});

router.post("/descontar-saldo", authMiddleware, async (req, res) => {
  try {
    const { monto } = req.body;
    if (monto === undefined || monto <= 0) {
      return res.status(400).json({ message: "Monto inválido" });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    if (user.balance < monto) {
      return res.status(400).json({ message: "Saldo insuficiente" });
    }

    user.balance -= monto;
    await user.save();

    res.json({ message: "Saldo descontado correctamente", balance: user.balance });
  } catch (err) {
    console.error("❌ Error al descontar saldo:", err);
    res.status(500).json({ message: "Error al descontar saldo" });
  }
});

// 📦 Obtener clientes con estadísticas avanzadas
router.get("/clientes", authMiddleware, async (req, res) => {
  try {
    const clientes = await User.find({ role: "cliente" }).select("name email _id telefono createdAt");

    const ahora = new Date();
    const hace30dias = new Date(ahora);
    hace30dias.setDate(ahora.getDate() - 30);
    const hace7dias = new Date(ahora);
    hace7dias.setDate(ahora.getDate() - 7);

    const clientesConEstadisticas = await Promise.all(
      clientes.map(async (cliente) => {
        const pedidos = await Order.find({ "envio.telRemitente": cliente.telefono });

        const total = pedidos.length;
        const mes = pedidos.filter(p => new Date(p.createdAt) >= hace30dias).length;
        const semana = pedidos.filter(p => new Date(p.createdAt) >= hace7dias).length;

        const ingresos = pedidos.reduce((total, p) => total + (p.envio?.costo || 0), 0);

        return {
          _id: cliente._id,
          nombre: cliente.name,
          correo: cliente.email,
          telefono: cliente.telefono,
          creadoEn: cliente.createdAt,
          enviosTotal: total,
          enviosMes: mes,
          enviosSemana: semana,
          totalIngresos: ingresos
        };
      })
    );

    res.json(clientesConEstadisticas);
  } catch (err) {
    console.error("❌ Error al obtener clientes con estadísticas:", err);
    res.status(500).json({ message: "Error interno al obtener clientes" });
  }
});

export default router;
