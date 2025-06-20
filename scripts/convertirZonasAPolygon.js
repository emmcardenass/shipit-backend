// scripts/convertirZonasAPolygon.js
import mongoose from 'mongoose';
import Zona from '../models/Zona.js';

// ⚠️ Cambia por tu URI de conexión real
const mongoUri = 'mongodb+srv://hypradmin:_bs8RBG9RmSCdCW@clusterhypr.yxyvrpa.mongodb.net/shipit?retryWrites=true&w=majority';

const convertirZonas = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');

    // Buscar zonas que NO tienen Polygon (las que tienen poligono como array simple)
    const zonas = await Zona.find({
      'poligono.type': { $exists: false }
    });

    console.log(`🔍 Zonas a convertir: ${zonas.length}`);

    for (const zona of zonas) {
      const oldCoords = zona.poligono; // Array de [lat, lng]

      if (!Array.isArray(oldCoords) || oldCoords.length === 0) {
        console.warn(`⚠️ Zona ${zona.nombre} sin coordenadas, se omite`);
        continue;
      }

      // Transformar a [ [lng, lat], ... ] para GeoJSON
      const polygonCoords = oldCoords.map(([lat, lng]) => [lng, lat]);

      // Asegurarse que se cierre el polígono (primer y último punto iguales)
      const firstPoint = polygonCoords[0];
      const lastPoint = polygonCoords[polygonCoords.length - 1];

      if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
        polygonCoords.push(firstPoint);
      }

      // Actualizar el campo poligono
      zona.poligono = {
        type: 'Polygon',
        coordinates: [polygonCoords],
      };

      await zona.save();
      console.log(`✅ Zona actualizada: ${zona.nombre}`);
    }

    console.log('🎉 Conversión completa');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al convertir zonas:', error);
    process.exit(1);
  }
};

convertirZonas();
