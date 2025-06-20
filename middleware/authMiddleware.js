import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  console.log("🔑 Authorization header:", authHeader); // 👈 ESTE ES EL LOG que necesitamos ver

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn("🚫 No token provided");
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Cargar el user completo desde MongoDB
    const user = await User.findById(decoded._id).select('-password');

    if (!user) {
      console.warn("🚫 Usuario no encontrado para el token:", decoded._id);
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    req.user = user; // Aquí sí tienes _id, role, email, name, etc.

    console.log("✅ Usuario autenticado:", user._id);

    next();
  } catch (error) {
    console.error('❌ Error en authMiddleware:', error);
    return res.status(401).json({ message: 'Token inválido' });
  }
};

export default authMiddleware;
