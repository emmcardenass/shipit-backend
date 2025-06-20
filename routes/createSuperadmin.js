// routes/createSuperadmin.js
import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

const router = express.Router();

router.get("/crear-superadmin", async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash("ShipIt@2025", 10);
    const usuario = new User({
      name: "Emmanuel Cárdenas",
      email: "superadmin@shipit.mx",
      password: hashedPassword,
      role: "superadmin",
      telefono: "8111111111",
      foto: ""
    });

    await usuario.save();
    res.json({ message: "✅ Superadmin creado con éxito" });
  } catch (err) {
    res.status(500).json({ message: "❌ Error al crear superadmin", error: err.message });
  }
});

export default router;
