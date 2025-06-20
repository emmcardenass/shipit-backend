// backend/scripts/verTarifas.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Tarifa from '../models/Tarifa.js';
import Zona from '../models/Zona.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const run = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Conectado a MongoDB\n');

    const tarifas = await Tarifa.find().populate('zonas', 'nombre');

    console.log(`📝 Tarifas encontradas: ${tarifas.length}\n`);

    tarifas.forEach((tarifa, index) => {
      console.log(`#${index + 1} Zona: ${tarifa.zonas.map(z => z.nombre).join(', ')}`);
      console.log(`   Tipo Servicio: ${tarifa.tipoServicio}`);
      console.log(`   Peso Min: ${tarifa.pesoMin} kg`);
      console.log(`   Peso Max: ${tarifa.pesoMax} kg`);
      console.log(`   Precio: $${tarifa.precio} MXN`);
      console.log('-------------------------');
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

run();
