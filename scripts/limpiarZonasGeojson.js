// scripts/limpiarZonasGeojson.js
import fs from 'fs';
import path from 'path';

// Ahora trabajamos directamente sobre zonas-limpio.geojson
const geojsonPath = path.join('public', 'zonas-limpio.geojson');

// Leer archivo original
const geojsonData = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));

// Función para limpiar coords (quita valores extra después de lng, lat)
function limpiarCoords(coords) {
  return coords.map(pair => pair.slice(0, 2)); // solo deja [lng, lat]
}

// Función para limpiar un Polygon (1 anidación)
function limpiarPolygon(polygonCoords) {
  return polygonCoords.map(ring => limpiarCoords(ring));
}

// Función para limpiar un MultiPolygon (2 anidaciones)
function limpiarMultiPolygon(multiPolygonCoords) {
  return multiPolygonCoords.map(polygon => limpiarPolygon(polygon));
}

// Nueva lista de features limpias
const featuresLimpias = [];

geojsonData.features.forEach((feature) => {
  const nombreZona = feature.properties?.name || feature.properties?.zona || "Zona sin nombre";
  const tipo = feature.geometry?.type;

  if (tipo === 'GeometryCollection') {
    const geometries = feature.geometry?.geometries || [];
    const soloPolygons = geometries.every(g => g.type === 'Polygon');

    if (soloPolygons) {
      console.log(`🔄 Convirtiendo y limpiando "${nombreZona}" → MultiPolygon...`);

      const multiPolygonCoords = geometries.map(g =>
        limpiarPolygon(g.coordinates)
      );

      const featureLimpia = {
        type: 'Feature',
        properties: feature.properties,
        geometry: {
          type: 'MultiPolygon',
          coordinates: multiPolygonCoords
        }
      };

      featuresLimpias.push(featureLimpia);
    } else {
      console.log(`⚠️ "${nombreZona}" contiene geometrías no compatibles. Se omite por seguridad.`);
    }
  } else if (tipo === 'Polygon') {
    console.log(`✅ Limpiando "${nombreZona}" → Polygon...`);

    const featureLimpia = {
      type: 'Feature',
      properties: feature.properties,
      geometry: {
        type: 'Polygon',
        coordinates: limpiarPolygon(feature.geometry.coordinates)
      }
    };

    featuresLimpias.push(featureLimpia);
  } else if (tipo === 'MultiPolygon') {
    console.log(`✅ Limpiando "${nombreZona}" → MultiPolygon...`);

    const featureLimpia = {
      type: 'Feature',
      properties: feature.properties,
      geometry: {
        type: 'MultiPolygon',
        coordinates: limpiarMultiPolygon(feature.geometry.coordinates)
      }
    };

    featuresLimpias.push(featureLimpia);
  } else {
    console.log(`⚠️ "${nombreZona}" tiene tipo de geometría no esperado (${tipo}). Se omite.`);
  }
});

// Crear el nuevo GeoJSON limpio (sobreescribe zonas-limpio.geojson)
const geojsonLimpio = {
  type: 'FeatureCollection',
  features: featuresLimpias
};

fs.writeFileSync(geojsonPath, JSON.stringify(geojsonLimpio, null, 2), 'utf8');

console.log('✅ Limpieza completa. Archivo actualizado: public/zonas-limpio.geojson');
