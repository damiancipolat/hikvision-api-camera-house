/**
 * Configuración de las cámaras Hikvision
 */

const CAMERAS = {
  1: {
    id: process.env.CAMERA_1_ID,
    name: 'Cámara 1'
  },
  2: {
    id: process.env.CAMERA_2_ID,
    name: 'Cámara 2'
  },
  3: {
    id: process.env.CAMERA_3_ID,
    name: 'Cámara 3'
  }
};

// Cookie de sesión - IMPORTANTE: Actualizar cuando expire (variable de entorno JSESSIONID)
const JSESSIONID = process.env.JSESSIONID;

// Base URL de la API
const BASE_URL = 'https://isa-team.hikcentralconnect.com/hcc/resource/v1/logicalresource/element/camera';

module.exports = {
  CAMERAS,
  JSESSIONID,
  BASE_URL
};
