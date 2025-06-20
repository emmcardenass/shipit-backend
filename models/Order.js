// backend/models/Order.js
import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  origen: {
    direccion: { type: String, required: true },
    coordenadas: { type: [Number], default: [] },
    referencia: { type: String, default: "" },
    nombre: { type: String, default: "" },
    telefono: { type: String, default: "" },
    email: { type: String, default: "" }, // 🆕 agregamos email
  },

  destino: {
    direccion: { type: String, required: true },
    coordenadas: { type: [Number], default: [] },
    referencia: { type: String, default: "" },
    nombre: { type: String, default: "" },
    telefono: { type: String, default: "" },
    email: { type: String, default: "" }, // 🆕 agregamos email
  },

  envio: {
    numeroGuia: { type: String },
    prefijoCiudad: { type: String },

    tipo: {
      type: String,
      enum: ['express', 'standard', 'fulfillment'],
      default: 'standard',
    },

    tipoPago: {
      type: String,
      enum: ['prepago', 'COD'],
      default: 'prepago',
    },

    contenido: { type: String, required: true },
    instrucciones: { type: String, default: "" },

    alto: { type: String, default: "" },
    largo: { type: String, default: "" },
    ancho: { type: String, default: "" },
    peso: { type: String, default: "" },
    dimensiones: { type: String, default: "" },

    cod: { type: String, default: "" },

    costo: { type: Number, default: 0 },
    costoCOD: { type: Number, default: 0 },      // 🆕 para que quede limpio
    totalCobrado: { type: Number, default: 0 },  // 🆕 para que quede limpio
    zonaCalculada: { type: String, default: "" } // 🆕 para que quede limpio
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
    
  estado: {
    type: String,
    enum: [
      'creado',        // ✅ nuevo estado inicial
      'recolectado',   // ✅ cuando el repartidor lo recoge
      'en_camino',     // ✅ en tránsito
      'entregado',     // ✅ éxito
      'reagendado',    // ✅ reagendado
      'cancelado'      // ✅ fallido o anulado
    ],
    default: 'creado',
  },

  asignadoA: {
    type: String,
    default: '',
  },

  // 🆕 Campos para la lógica de rutas
  fechaRecoleccionProgramada: { type: Date },
  fechaEntregaProgramada: { type: Date },
  estadoEntrega: {
    type: String,
    enum: ['pendiente', 'enRuta', 'entregado', 'reagendado', 'cancelado'],
    default: 'pendiente'
  },
  intentosEntrega: { type: Number, default: 0 },

}, {
  timestamps: true,
});

const Order = mongoose.model('Order', orderSchema);
export default Order;
