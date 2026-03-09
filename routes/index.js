const express = require('express');
const router = express.Router();
const cameraController = require('../controllers/cameraController');
const cameraRoutes = require('./cameraRoutes');

/**
 * Router principal - Combina todas las rutas de la aplicación
 */

// Ruta raíz - Información de la API
router.get('/', cameraController.getWelcome);

// Rutas de cámaras
router.use('/', cameraRoutes);

module.exports = router;
