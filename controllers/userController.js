import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

// ✅ Registrar nuevo usuario
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role = 'cliente', telefono } = req.body;

    // Validar email único
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    // Validar teléfono único
    if (telefono) {
      const telefonoExists = await User.findOne({ telefono });
      if (telefonoExists) {
        return res.status(400).json({ message: 'Ya existe un usuario con este número de teléfono' });
      }
    }

    const newUser = new User({ name, email, password, role, telefono });
    await newUser.save();

    res.status(201).json({
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      token: generateToken(newUser),
    });
  } catch (error) {
    console.error('❌ Error registrando usuario:', error);
    res.status(500).json({ message: 'Error interno al registrar usuario' });
  }
};

// ✅ Login de usuario existente
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    const isMatch = await user?.matchPassword(password);

    if (!user || !isMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user),
    });
  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({ message: 'Error interno al iniciar sesión' });
  }
};

// ✅ Crear un admin desde una ruta especial (para desarrollo)
export const crearAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const adminExistente = await User.findOne({ email });
    if (adminExistente) {
      return res.status(400).json({ message: 'El admin ya existe' });
    }

    const nuevoAdmin = new User({
      name: 'Admin SHIP IT!',
      email,
      password,
      role: 'admin',
    });

    await nuevoAdmin.save();

    res.status(201).json({
      _id: nuevoAdmin._id,
      name: nuevoAdmin.name,
      email: nuevoAdmin.email,
      role: nuevoAdmin.role,
      token: generateToken(nuevoAdmin),
    });
  } catch (error) {
    console.error('❌ Error al crear admin:', error);
    res.status(500).json({ message: 'Error interno al crear admin' });
  }
};

// ✅ Actualizar perfil de usuario (nombre, dirección, teléfono, estimadoEnvios)
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    user.name = req.body.name || user.name;
    user.telefono = req.body.telefono || user.telefono;
    user.direccion = req.body.direccion || user.direccion;
    user.estimadoEnvios = req.body.estimadoEnvios || user.estimadoEnvios;

    await user.save();

    res.json({ message: 'Perfil actualizado correctamente' });
  } catch (error) {
    console.error('❌ Error al actualizar perfil:', error);
    res.status(500).json({ message: 'Error al actualizar perfil' });
  }
};

// ✅ Obtener billetera del usuario
export const getWallet = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({
      balance: user.balance || 0,
      transacciones: user.transacciones || [],
    });
  } catch (error) {
    console.error('❌ Error al obtener billetera:', error);
    res.status(500).json({ message: 'Error al obtener billetera' });
  }
};

// ✅ Obtener todos los usuarios con rol 'cliente'
import Pedido from "../models/Order.js"; // Asegúrate de tener este modelo importado

export const obtenerClientes = async (req, res) => {
  try {
    const clientes = await User.find({ role: "cliente" }).select("name email _id telefono createdAt");

    const clientesConDatos = await Promise.all(
      clientes.map(async (cliente) => {
        const pedidos = await Pedido.find({ "envio.telRemitente": cliente.telefono });

        const totalEnvios = pedidos.length;
        const ahora = new Date();
        const hace30dias = new Date(ahora);
        hace30dias.setDate(ahora.getDate() - 30);
        const hace7dias = new Date(ahora);
        hace7dias.setDate(ahora.getDate() - 7);

        const enviosMes = pedidos.filter(p => new Date(p.createdAt) >= hace30dias).length;
        const enviosSemana = pedidos.filter(p => new Date(p.createdAt) >= hace7dias).length;

        // Ingresos: asumimos que cada pedido tiene un campo `precioTotal` o similar
        const totalIngresos = pedidos.reduce((total, p) => total + (p.precioTotal || 0), 0);

        return {
          _id: cliente._id,
          nombre: cliente.name,
          correo: cliente.email,
          telefono: cliente.telefono,
          creadoEn: cliente.createdAt,
          enviosTotal: totalEnvios,
          enviosMes,
          enviosSemana,
          totalIngresos
        };
      })
    );

    res.json(clientesConDatos);
  } catch (error) {
    console.error("❌ Error al obtener clientes:", error);
    res.status(500).json({ message: "Error al obtener clientes" });
  }
};

// ✅ Obtener perfil del usuario (para Sidebar y CrearPedido)
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      telefono: user.telefono,
      direccion: user.direccion,
      balance: user.balance || 0
    });
  } catch (error) {
    console.error('❌ Error al obtener perfil:', error);
    res.status(500).json({ message: 'Error al obtener perfil' });
  }
};
