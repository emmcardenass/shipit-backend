import mongoose from "mongoose";

const tarifaClienteSchema = new mongoose.Schema({
  clienteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  zona: {
    type: String,
    required: true
  },
  precio: {
    type: Number,
    required: true
  },
  pesoMin: {
    type: Number,
    required: true
  },
  pesoMax: {
    type: Number,
    required: true
  },
  tipoServicio: {
    type: String,
    required: true
  },
  incluyeCOD: {
    type: Boolean,
    default: false
  }
});

export default mongoose.model("TarifaCliente", tarifaClienteSchema);
