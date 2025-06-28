import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  role: {
    type: String,
    enum: ['cliente', 'admin', 'repartidor', 'superadmin'],
    default: 'cliente',
  },
  telefono: { type: String, default: "" },
  direccion: { type: String, default: "" },
  foto: { type: String, default: "" },
  estimadoEnvios: { type: String, default: "" },
  balance: { type: Number, default: 0 },
  saldoEnvios: { type: Number, default: 0 },
  transacciones: [
    {
      _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
      fecha: { type: Date, default: Date.now },
      tipo: { type: String, required: true },
      monto: { type: Number, required: true },
      banco: { type: String, default: "" },
      bancoOtro: { type: String, default: "" },
      clabe: { type: String, default: "" },
      aprobado: { type: Boolean, default: false },
      rechazado: { type: Boolean, default: false }, // Opcional, si quieres dejar histórico de rechazos
    },
  ],
}, {
  timestamps: true,
});

// 💡 Mejora: evita doble hash si ya es bcrypt
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  // Si ya es un hash bcrypt válido, no lo vuelvas a encriptar
  if (this.password.startsWith("$2b$")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
