// scripts/verNombresZonas.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
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

    const zonas = await Zona.find().lean();

    console.log(`🌎 Zonas encontradas: ${zonas.length}\n`);

    zonas.forEach(zona => {
      console.log(zona.nombre);
    });

    await mongoose.disconnect();
    console.log('\n✅ Listo.\n');
  } catch (error) {
    console.error('❌ Error en verNombresZonas:', error);
    process.exit(1);
  }
};

run();
