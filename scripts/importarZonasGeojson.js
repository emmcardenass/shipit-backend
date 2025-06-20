// scripts/importarZonasGeojson.js
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import Zona from '../models/Zona.js';

const mongoUri = 'mongodb+srv://hypradmin:_bs8RBG9RmSCdCW@clusterhypr.yxyvrpa.mongodb.net/shipit?retryWrites=true&w=majority';
const geojsonPath = path.join('public', 'zonas-limpio.geojson');

const importarZonas = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');

    const geojsonData = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));

    if (!geojsonData.features || !Array.isArray(geojsonData.features)) {
      throw new Error('El archivo GeoJSON no contiene "features" válidas.');
    }

    console.log(`🔍 Zonas en el archivo: ${geojsonData.features.length}`);

    let importadas = 0;
    let actualizadas = 0;
    let omitidas = 0;

    for (const feature of geojsonData.features) {
      const nombre = feature.properties?.name?.trim();
      const geometry = feature.geometry;

      // ✅ Aceptar Polygon y MultiPolygon
      const esValida = geometry &&
        (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') &&
        Array.isArray(geometry.coordinates) &&
        geometry.coordinates.length > 0;

      if (!nombre || !esValida) {
        console.warn(`⚠️ Zona "${nombre || '(sin nombre)'}" sin geometría válida, se omite.`);
        omitidas++;
        continue;
      }

      const zonaExistente = await Zona.findOne({ nombre });

      if (zonaExistente) {
        zonaExistente.poligono = {
          type: geometry.type,
          coordinates: geometry.coordinates,
        };
        await zonaExistente.save();
        console.log(`♻️ Zona actualizada: ${nombre}`);
        actualizadas++;
      } else {
        const nuevaZona = new Zona({
          nombre,
          poligono: {
            type: geometry.type,
            coordinates: geometry.coordinates,
          },
          tarifasAsociadas: [],
        });
        await nuevaZona.save();
        console.log(`✅ Zona creada: ${nombre}`);
        importadas++;
      }
    }

    console.log('--------------------------------');
    console.log(`✅ Zonas creadas nuevas: ${importadas}`);
    console.log(`♻️ Zonas actualizadas: ${actualizadas}`);
    console.log(`⚠️ Zonas omitidas: ${omitidas}`);
    console.log('✅ Proceso de importación terminado');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al importar zonas:', error);
    process.exit(1);
  }
};

importarZonas();
