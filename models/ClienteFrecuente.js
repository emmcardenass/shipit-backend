// backend/models/ClienteFrecuente.js
import mongoose from "mongoose";

const clienteFrecuenteSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    nombre: { type: String, required: true },
    telefono: { type: String, required: true },
    direccion: { type: String, required: true },
    coordenadas: { type: [Number], default: [] }, // ✅ <-- AGREGADO
    email: { type: String },
    notas: { type: String }
  },
  { timestamps: true }
);

const ClienteFrecuente = mongoose.model("ClienteFrecuente", clienteFrecuenteSchema);
export default ClienteFrecuente;
