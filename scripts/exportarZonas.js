// scripts/exportarZonas.js
import mongoose from 'mongoose';
import fs from 'fs';
import dotenv from 'dotenv';
import Zona from '../models/Zona.js';

dotenv.config();

const exportarZonas = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Conectado a Mongo');

    const zonas = await Zona.find().lean();

    // Para exportar solo los campos que quieres
    const exportData = zonas.map(z => ({
      _id: z._id.toString(),
      nombre: z.nombre,
      poligono: z.poligono,
    }));

    // Crea carpeta exportaciones si no existe
    if (!fs.existsSync('./exportaciones')) {
      fs.mkdirSync('./exportaciones');
    }

    // Guarda archivo
    fs.writeFileSync('./exportaciones/zonas.json', JSON.stringify(exportData, null, 2));
    console.log(`✅ Exportadas ${exportData.length} zonas a ./exportaciones/zonas.json`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error al exportar zonas:', error);
    process.exit(1);
  }
};

exportarZonas();
