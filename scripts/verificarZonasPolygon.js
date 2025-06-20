// scripts/verificarZonasPolygon.js
import mongoose from 'mongoose';
import Zona from '../models/Zona.js';

// ⚠️ Cambia tu URI de conexión aquí
const mongoUri = 'mongodb+srv://hypradmin:_bs8RBG9RmSCdCW@clusterhypr.yxyvrpa.mongodb.net/shipit?retryWrites=true&w=majority';

const verificarZonas = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');

    const zonas = await Zona.find();

    console.log(`🔍 Total zonas en Mongo: ${zonas.length}`);

    let ok = 0;
    let errores = 0;

    for (const zona of zonas) {
      const poligono = zona.poligono;

      if (
        poligono &&
        poligono.type === 'Polygon' &&
        Array.isArray(poligono.coordinates) &&
        poligono.coordinates.length > 0 &&
        Array.isArray(poligono.coordinates[0]) &&
        poligono.coordinates[0].length > 2
      ) {
        console.log(`✅ Zona OK: ${zona.nombre}`);
        ok++;
      } else {
        console.warn(`❌ Zona inválida: ${zona.nombre}`);
        errores++;
      }
    }

    console.log('--------------------------------');
    console.log(`✅ Zonas OK: ${ok}`);
    console.log(`❌ Zonas con error: ${errores}`);
    console.log('✅ Verificación completa');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al verificar zonas:', error);
    process.exit(1);
  }
};

verificarZonas();
