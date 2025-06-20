// backend/models/Tarifa.js
import mongoose from "mongoose";

const tarifaSchema = new mongoose.Schema({
  zonas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Zona' }],

  precio: { type: Number, required: true },
  pesoMin: { type: Number, required: true },
  pesoMax: { type: Number, required: true },

  tipoServicio: {
    type: String,
    enum: ['express', 'standard', 'fulfillment'],
    required: true
  },

  incluyeCOD: { type: Boolean, default: false },

  // $17 MXN de base, en la lógica puedes aplicar el extra si montoCOD > 3000
  valorCOD: { type: Number, default: 17 }
});

export default mongoose.model("Tarifa", tarifaSchema);
