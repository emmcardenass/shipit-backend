// scripts/crearIndice2dsphere.js
import mongoose from 'mongoose';
import Zona from '../models/Zona.js';

// ⚠️ Cambia tu URI si es diferente
const mongoUri = 'mongodb+srv://hypradmin:_bs8RBG9RmSCdCW@clusterhypr.yxyvrpa.mongodb.net/shipit?retryWrites=true&w=majority';

const crearIndice2dsphere = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');

    await Zona.collection.createIndex({ poligono: '2dsphere' });
    console.log('✅ Índice 2dsphere creado correctamente en el campo "poligono" de la colección "zonas"');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear el índice 2dsphere:', error);
    process.exit(1);
  }
};

crearIndice2dsphere();
