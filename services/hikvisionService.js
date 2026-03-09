const axios = require('axios');
const { BASE_URL, JSESSIONID } = require('../config/cameras');

/**
 * Servicio para interactuar con la API de Hikvision
 */
class HikvisionService {
  /**
   * Obtiene la URL de la imagen thumbnail de una cámara
   * @param {string} cameraId - ID de la cámara en Hikvision
   * @returns {Promise<Object>} Objeto con success y data/error
   */
  async getCameraThumbnail(cameraId) {
    try {
      const url = `${BASE_URL}/${cameraId}/thumbnail?refresh=1&&needEncrypt=1`;

      const response = await axios.get(url, {
        headers: {
          'accept': 'application/json, text/plain, */*',
          'accept-language': 'es-US,es-419;q=0.9,es;q=0.8',
          'clientsource': '0',
          'content-type': 'application/json',
          'cookie': `JSESSIONID=${JSESSIONID}`,
          'origin': 'https://www.hik-connect.com',
          'referer': 'https://www.hik-connect.com/',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'cross-site',
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36'
        }
      });

      if (response.data && response.data.errorCode === '0') {
        return {
          success: true,
          data: response.data.data
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Error desconocido'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Descarga la imagen desde la URL de AWS S3
   * @param {string} imageUrl - URL de la imagen en AWS S3
   * @returns {Promise<Object>} Objeto con success y data/error
   */
  async downloadImage(imageUrl) {
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer'
      });
      return {
        success: true,
        data: response.data,
        contentType: response.headers['content-type'] || 'image/jpeg'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtiene thumbnails de múltiples cámaras en paralelo
   * @param {Array<Object>} cameras - Array de objetos de cámara
   * @param {boolean} download - Si se deben descargar las imágenes
   * @returns {Promise<Array>} Array de resultados
   */
  async getMultipleCameraThumbnails(cameras, download = false) {
    return Promise.all(
      Object.keys(cameras).map(async (key) => {
        const camera = cameras[key];
        const thumbnail = await this.getCameraThumbnail(camera.id);

        if (!thumbnail.success) {
          return {
            camera: key,
            name: camera.name,
            error: thumbnail.error
          };
        }

        if (download && thumbnail.data.picUrl) {
          const image = await this.downloadImage(thumbnail.data.picUrl);
          if (image.success) {
            return {
              camera: key,
              name: camera.name,
              imageBase64: image.data.toString('base64'),
              contentType: image.contentType,
              createTime: thumbnail.data.createTime
            };
          }
        }

        return {
          camera: key,
          name: camera.name,
          picUrl: thumbnail.data.picUrl,
          createTime: thumbnail.data.createTime,
          isEncrypt: thumbnail.data.isEncrypt
        };
      })
    );
  }
}

module.exports = new HikvisionService();
