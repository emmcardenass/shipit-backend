// backend/models/Zona.js
import mongoose from 'mongoose';

const zonaSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  poligono: {
    type: {
      type: String,
      enum: ['Polygon', 'MultiPolygon'], // acepta ambos
      required: true
    },
    coordinates: {
      type: mongoose.Schema.Types.Mixed, // acepta Polygon o MultiPolygon
      required: true
    }
  },
  tarifasAsociadas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tarifa' }],
}, {
  timestamps: true,
});

const Zona = mongoose.model('Zona', zonaSchema);
export default Zona;
