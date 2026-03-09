const express = require('express');
const router = express.Router();
const cameraController = require('../controllers/cameraController');

/**
 * Rutas de cámaras
 */

// GET /cameras - Obtener todas las cámaras
router.get('/cameras', cameraController.getAllCameras);

// GET /camera/:id - Obtener una cámara específica
router.get('/camera/:id', cameraController.getCameraById);

module.exports = router;
