/**
 * Configuración de las cámaras Hikvision
 */

const CAMERAS = {
  1: {
    id: 'ec0e4babb5bc40ff9bba0cd9c17b11ca',
    name: 'Cámara 1'
  },
  2: {
    id: '9c2a039e87e34f8c877f858b36ecf6b8',
    name: 'Cámara 2'
  },
  3: {
    id: 'c913adc6e73148f6a524a5b3d554579d',
    name: 'Cámara 3'
  }
};

// Cookie de sesión - IMPORTANTE: Actualizar cuando expire
const JSESSIONID = '53a0c746-1a5a-491f-adbf-8357bdc8abc7';

// Base URL de la API
const BASE_URL = 'https://isa-team.hikcentralconnect.com/hcc/resource/v1/logicalresource/element/camera';

module.exports = {
  CAMERAS,
  JSESSIONID,
  BASE_URL
};
