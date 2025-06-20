import fs from 'fs';
import path from 'path';

const geojsonPath = path.join('public', 'zonas.geojson');
const geojsonData = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));

for (const feature of geojsonData.features) {
  const nombre = feature.properties?.name?.trim();
  const geometry = feature.geometry;

  if (nombre === 'Monterrey Sur') {
    console.log('👉 Zona Monterrey Sur encontrada!');
    console.log('Tipo:', geometry.type);
    console.log('Coordinates length:', geometry.coordinates?.length);
    console.log('Primer nivel de coordinates:', geometry.coordinates);
  }
}
