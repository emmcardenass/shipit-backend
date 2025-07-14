// server.js
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// 📦 Rutas principales
import orderRoutes from './routes/orderRoutes.js';
import userRoutes from './routes/userRoutes.js';
import driverRoutes from './routes/driverRoutes.js';
import skydropxRoutes from './routes/skydropxRoutes.js';
import clientesFrecuentesRoutes from './routes/clientesFrecuentes.js';
import rastreoRoutes from './routes/rastreo.js'; // ✅ Rastrear paquete
import crearSuperadmin from './routes/createSuperadmin.js'; // ✅ Ruta temporal
import tarifasRoutes from './routes/tarifas.routes.js'; // ✅ NUEVO
import tarifasClienteRoutes from './routes/tarifaCliente.routes.js'; // ✅ Tarifa personalizada por cliente
import walletRoutes from './routes/wallet.js'; // ✅ Ruta de billetera
import dashboardSuperadminRoutes from './routes/dashboardSuperadminRoutes.js';
import zonaRoutes from './routes/zonaRoutes.js';
import shipdayRoutes from './routes/shipdayRoutes.js';
import shipdayWebhook from "./routes/shipdayWebhook.js";
import exportRoutes from "./routes/exportRoutes.js"; 

dotenv.config();
const app = express();

// ⚙️ Obtener __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🛡️ Middlewares
app.use(cors({
  origin: [
    "http://localhost:5173", 
    "https://shipit-frontend-q97x.onrender.com", 
    "https://shipit-backend-q97x.onrender.com"
  ],
  credentials: true
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 🖼️ Servir fotos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 🔌 Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected.'))
.catch((error) => console.error('❌ Error connecting to MongoDB:', error));

// 🚀 Rutas API
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/zonas', zonaRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/skydropx', skydropxRoutes);
app.use('/api/clientes', clientesFrecuentesRoutes);
app.use('/api/rastreo', rastreoRoutes);
app.use('/api/utils', crearSuperadmin);
app.use('/api/tarifas', tarifasRoutes);
app.use('/api/tarifas-cliente', tarifasClienteRoutes);
app.use('/api/wallet', walletRoutes); // ✅ Nueva ruta agregada sin afectar lo demás
app.use('/api/dashboard', dashboardSuperadminRoutes);
app.use('/api/shipday', shipdayRoutes);
app.use("/api/shipday", shipdayWebhook);
app.use('/api/orders/export', exportRoutes);

// 🏠 Ruta base
app.get('/', (req, res) => {
  res.send('🚀 Ship It Backend funcionando');
});

// 🔊 Escuchar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
