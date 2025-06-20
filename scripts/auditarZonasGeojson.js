// scripts/auditarZonasGeojson.js
import fs from 'fs';
import path from 'path';

// Ruta a tu archivo geojson
const geojsonPath = path.join('data', 'zonas.geojson'); // ajusta la ruta si es necesario

// Leer archivo geojson
const geojsonData = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));

// Procesar zonas
console.log("🔍 Auditando zonas.geojson...");
console.log(`Total de features: ${geojsonData.features.length}`);
console.log("----------------------------------------");

geojsonData.features.forEach((feature) => {
  const nombreZona = feature.properties?.name || feature.properties?.zona || "Zona sin nombre";
  const tipo = feature.geometry?.type;
  const geometries = feature.geometry?.geometries;

  if (tipo === 'Polygon' || tipo === 'MultiPolygon') {
    console.log(`✅ ${nombreZona} → ${tipo}`);
  } else if (tipo === 'GeometryCollection') {
    const tiposInternos = geometries?.map(g => g.type).join(', ');
    console.log(`❌ ${nombreZona} → GeometryCollection (contiene: ${tiposInternos})`);
  } else {
    console.log(`⚠️ ${nombreZona} → ${tipo} (tipo no esperado)`);
  }
});

console.log("----------------------------------------");
console.log("✅ Auditoría completa.");
