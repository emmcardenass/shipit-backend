// scripts/verZonas.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Zona from '../models/Zona.js';
import Tarifa from '../models/Tarifa.js';

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Conectado a MongoDB\n');

    const zonas = await Zona.find();

    console.log(`🌎 Zonas encontradas: ${zonas.length}\n`);

    for (const zona of zonas) {
      // Contar tarifas asociadas a esta zona
      const tarifasCount = await Tarifa.countDocuments({ zonas: zona._id });

      console.log(`Zona: ${zona.nombre}`);
      console.log(`📌 Puntos en polígono: ${zona.poligono?.coordinates?.[0]?.length || 0}`);
      console.log(`💰 Tarifas asociadas: ${tarifasCount}${tarifasCount === 0 ? ' ❌' : ''}`);
      console.log('-------------------------');
    }

    await mongoose.disconnect();
    console.log('\n✅ Listo.\n');
  } catch (error) {
    console.error('❌ Error en verZonas:', error);
    process.exit(1);
  }
};

run();
