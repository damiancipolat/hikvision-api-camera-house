const hikvisionService = require('../services/hikvisionService');
const { CAMERAS } = require('../config/cameras');

/**
 * Controlador para los endpoints de cámaras
 */
class CameraController {
  /**
   * GET / - Endpoint de bienvenida
   */
  getWelcome(req, res) {
    res.json({
      message: 'API de Cámaras Hikvision',
      endpoints: {
        '/cameras': 'Obtener URLs de todas las cámaras',
        '/cameras?download=true': 'Obtener todas las imágenes en base64',
        '/camera/:id': 'Obtener URL de una cámara específica (1, 2 o 3)',
        '/camera/:id?download=true': 'Descargar imagen de una cámara específica',
        '/camera/:id?download=true&base64=true': 'Obtener imagen en base64 lista para Claude'
      }
    });
  }

  /**
   * GET /cameras - Obtener todas las cámaras
   */
  async getAllCameras(req, res) {
    const download = req.query.download === 'true';

    try {
      const results = await hikvisionService.getMultipleCameraThumbnails(CAMERAS, download);

      res.json({
        success: true,
        cameras: results
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /camera/:id - Obtener una cámara específica
   */
  async getCameraById(req, res) {
    const cameraId = req.params.id;
    const download = req.query.download === 'true';
    const base64 = req.query.base64 === 'true';

    // Validar que la cámara existe
    if (!CAMERAS[cameraId]) {
      return res.status(404).json({
        success: false,
        error: 'Cámara no encontrada. Use IDs: 1, 2 o 3'
      });
    }

    const camera = CAMERAS[cameraId];

    try {
      // Obtener thumbnail
      const thumbnail = await hikvisionService.getCameraThumbnail(camera.id);

      if (!thumbnail.success) {
        return res.status(500).json({
          success: false,
          error: thumbnail.error
        });
      }

      // Si se solicita descarga, descargar y enviar la imagen
      if (download && thumbnail.data.picUrl) {
        const image = await hikvisionService.downloadImage(thumbnail.data.picUrl);

        if (!image.success) {
          return res.status(500).json({
            success: false,
            error: `Error descargando imagen: ${image.error}`
          });
        }

        // Si se solicita base64, devolver JSON listo para Claude
        if (base64) {
          return res.json({
            success: true,
            camera: cameraId,
            name: camera.name,
            createTime: thumbnail.data.createTime,
            image: {
              type: 'base64',
              media_type: image.contentType,
              data: image.data.toString('base64')
            }
          });
        }

        // Enviar la imagen directamente como binario
        res.set('Content-Type', image.contentType);
        res.set('Content-Disposition', `inline; filename="camera_${cameraId}.jpg"`);
        return res.send(image.data);
      }

      // Enviar solo la información de la URL
      res.json({
        success: true,
        camera: cameraId,
        name: camera.name,
        picUrl: thumbnail.data.picUrl,
        createTime: thumbnail.data.createTime,
        isEncrypt: thumbnail.data.isEncrypt
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new CameraController();
