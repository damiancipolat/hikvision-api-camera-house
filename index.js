const express = require('express');
const routes = require('./routes');

/**
 * Aplicación principal - Punto de entrada del servidor
 */
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsear JSON
app.use(express.json());

// Usar el router principal
app.use('/', routes);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log('\n📡 Endpoints disponibles:');
  console.log('  GET  /              - Información de la API');
  console.log('  GET  /cameras       - Obtener todas las URLs de cámaras');
  console.log('  GET  /cameras?download=true - Obtener imágenes en base64');
  console.log('  GET  /camera/:id    - Obtener URL de cámara específica (1, 2 o 3)');
  console.log('  GET  /camera/:id?download=true - Descargar imagen directamente');
  console.log('\n⚠️  NOTA: Recuerda actualizar el JSESSIONID en config/cameras.js cuando expire\n');
});
