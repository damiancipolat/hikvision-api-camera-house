# CLAUDE.md - Documentación del Proyecto

## Descripción General

Este proyecto es una API REST desarrollada en Node.js con Express que actúa como proxy/gateway para obtener imágenes de cámaras Hikvision a través de la plataforma Hik-Connect. El objetivo es simplificar el acceso a las imágenes de las cámaras mediante endpoints simples y amigables.

## Contexto del Proyecto

El usuario tenía 3 comandos curl que utilizaba para acceder a las imágenes de cámaras Hikvision desde la plataforma Hik-Connect. Necesitaba:
1. Convertir esos curls a código Node.js usando axios
2. Crear endpoints REST para acceder a las imágenes
3. Soportar tanto la obtención de URLs como la descarga directa de imágenes
4. Manejar correctamente las cookies de sesión (JSESSIONID)

## Estructura del Proyecto

```
/Users/damian/projects/lab/cameras/
├── config/
│   └── cameras.js              # Configuración de cámaras y constantes
├── controllers/
│   └── cameraController.js     # Controladores con lógica de negocio
├── routes/
│   ├── index.js                # Router principal
│   └── cameraRoutes.js         # Definición de rutas de cámaras
├── services/
│   └── hikvisionService.js     # Servicio para llamadas a API Hikvision
├── index.js                    # Punto de entrada del servidor
├── package.json                # Dependencias y scripts
├── .gitignore                  # Archivos a ignorar en git
├── README.md                   # Documentación de uso
└── CLAUDE.md                   # Este archivo - documentación técnica
```

### Arquitectura MVC

El proyecto sigue una arquitectura limpia y modular:

- **index.js**: Punto de entrada, configuración mínima del servidor Express
- **routes/**: Definición de endpoints y sus rutas
- **controllers/**: Lógica de negocio y manejo de requests/responses
- **services/**: Capa de servicios para llamadas a APIs externas
- **config/**: Configuraciones y constantes del proyecto

## Arquitectura y Decisiones Técnicas

### 1. Stack Tecnológico
- **Express**: Framework web minimalista para Node.js
- **Axios**: Cliente HTTP para hacer peticiones a la API de Hikvision
- **Node.js**: Runtime de JavaScript

### 2. Conversión de CURL a Axios

Los curls originales tenían la siguiente estructura:
```bash
curl 'https://isa-team.hikcentralconnect.com/hcc/resource/v1/logicalresource/element/camera/{CAMERA_ID}/thumbnail?refresh=1&&needEncrypt=1'
  -H 'cookie: JSESSIONID=ea5c8080-1f8c-4770-8bf7-32dfd2934aa9'
  -H 'clientsource: 0'
  -H 'content-type: application/json'
  ...
```

Se convirtieron a axios manteniendo:
- **Headers críticos**: `clientsource`, `content-type`, `accept`, `origin`, `referer`
- **Cookie JSESSIONID**: Esencial para la autenticación
- **User-Agent**: Para simular navegador
- **Headers CORS**: `sec-fetch-*` para cumplir con políticas de seguridad

### 3. Configuración de Cámaras

Las cámaras están configuradas en el archivo `config/cameras.js`:

```javascript
const CAMERAS = {
  1: { id: 'ec0e4babb5bc40ff9bba0cd9c17b11ca', name: 'Cámara 1' },
  2: { id: '9c2a039e87e34f8c877f858b36ecf6b8', name: 'Cámara 2' },
  3: { id: 'c913adc6e73148f6a524a5b3d554579d', name: 'Cámara 3' }
};
```

Los IDs son identificadores únicos de cada cámara en el sistema Hikvision.

### 4. Autenticación

**JSESSIONID (config/cameras.js)**:
```javascript
const JSESSIONID = 'ea5c8080-1f8c-4770-8bf7-32dfd2934aa9';
```

- Es una cookie de sesión que expira después de cierto tiempo
- Debe actualizarse manualmente cuando expire
- Se obtiene iniciando sesión en Hik-Connect desde el navegador
- Se envía en cada petición en el header `Cookie`

## Flujo de Datos

### 1. Endpoint `/camera/:id`

```
Cliente HTTP → Express → getCameraThumbnail() → API Hikvision
                                              ↓
                                    Response con picUrl
                                              ↓
Cliente ← JSON Response ← Express ← Procesar respuesta
```

### 2. Endpoint `/camera/:id?download=true`

```
Cliente → Express → getCameraThumbnail() → API Hikvision (obtiene URL)
                           ↓
                    downloadImage() → AWS S3 (descarga JPEG)
                           ↓
Cliente ← Binary JPEG ← Express
```

### 3. Endpoint `/cameras`

```
Cliente → Express → Promise.all([
                      getCameraThumbnail(cam1),
                      getCameraThumbnail(cam2),
                      getCameraThumbnail(cam3)
                    ])
                           ↓
Cliente ← JSON Array ← Express
```

## Capas de la Aplicación

### Services (services/hikvisionService.js)

**HikvisionService** - Servicio para interactuar con la API de Hikvision

- `getCameraThumbnail(cameraId)`: Hace petición GET a la API de Hikvision
  - Parámetros: `refresh=1` y `needEncrypt=1`
  - Retorna objeto con `{ success, data }` o `{ success, error }`
  - La respuesta incluye `picUrl` que es una URL firmada de AWS S3

- `downloadImage(imageUrl)`: Descarga la imagen desde la URL de AWS S3
  - Usa `responseType: 'arraybuffer'` para obtener datos binarios
  - Retorna el buffer de la imagen y el content-type

- `getMultipleCameraThumbnails(cameras, download)`: Obtiene thumbnails de múltiples cámaras en paralelo
  - Usa `Promise.all()` para paralelizar las peticiones
  - Opcionalmente descarga las imágenes si `download=true`

### Controllers (controllers/cameraController.js)

**CameraController** - Maneja la lógica de negocio de los endpoints

- `getWelcome(req, res)`: Retorna información sobre la API
- `getAllCameras(req, res)`: Obtiene todas las cámaras usando el servicio
- `getCameraById(req, res)`: Obtiene una cámara específica o descarga su imagen

### Routes (routes/)

**routes/index.js** - Router principal que combina todas las rutas
**routes/cameraRoutes.js** - Define los endpoints de cámaras y los mapea a controladores

## Formato de Respuesta de la API Hikvision

La API de Hikvision responde con este formato:
```json
{
  "message": "",
  "data": {
    "picUrl": "https://ccf-sa-prod-resource-image.obs.sa-brazil-1.myhuaweicloud.com/...",
    "isEncrypt": 0,
    "createTime": 1773022007207
  },
  "errorCode": "0"
}
```

- **picUrl**: URL firmada de AWS S3 con la imagen (expira después de 1800 segundos)
- **isEncrypt**: Indica si la imagen está encriptada (0 = no)
- **createTime**: Timestamp de creación
- **errorCode**: "0" indica éxito

## Endpoints Implementados

### GET `/`
Endpoint informativo que muestra todos los endpoints disponibles.

### GET `/cameras`
Obtiene las URLs de todas las cámaras en paralelo usando `Promise.all()`.
- Respuesta: Array con objetos de cada cámara
- Incluye: `camera`, `name`, `picUrl`, `createTime`, `isEncrypt`

### GET `/cameras?download=true`
Descarga todas las imágenes y las devuelve en base64.
- Útil para aplicaciones que necesitan las imágenes inmediatamente
- Respuesta incluye: `imageBase64`, `contentType`, `createTime`

### GET `/camera/:id`
Obtiene la URL de una cámara específica (1, 2 o 3).
- Valida que el ID exista
- Retorna 404 si la cámara no existe

### GET `/camera/:id?download=true`
Descarga directamente la imagen en formato JPEG.
- Responde con binary data (arraybuffer)
- Headers: `Content-Type: image/jpeg`
- Header: `Content-Disposition: inline; filename="camera_{id}.jpg"`

## Manejo de Errores

El código implementa manejo de errores en varios niveles:

1. **Try-catch en funciones async**: Captura errores de red
2. **Validación de errorCode**: Verifica respuestas exitosas de Hikvision
3. **Validación de parámetros**: Verifica que el ID de cámara exista
4. **Respuestas estructuradas**: Siempre retorna `{ success: true/false }`

## Configuraciones Importantes

### Puerto
```javascript
const PORT = process.env.PORT || 3000;
```
Por defecto usa el puerto 3000, configurable via variable de entorno.

### Base URL
```javascript
const BASE_URL = 'https://isa-team.hikcentralconnect.com/hcc/resource/v1/logicalresource/element/camera';
```
URL base de la API de Hikvision para el tenant `isa-team`.

## Scripts NPM

- `npm start`: Inicia el servidor en modo producción
- `npm run dev`: Inicia el servidor con nodemon (auto-reload en desarrollo)

## Dependencias

### Producción
- **express@^4.18.2**: Framework web
- **axios@^1.6.0**: Cliente HTTP

### Desarrollo
- **nodemon@^3.0.1**: Auto-reload durante desarrollo

## Notas de Mantenimiento

### Actualizar JSESSIONID
Cuando la sesión expire (los endpoints devuelven error de autenticación):
1. Abrir https://www.hik-connect.com en el navegador
2. Iniciar sesión
3. Abrir DevTools (F12) → Network tab
4. Buscar peticiones a `hikcentralconnect.com`
5. Copiar el valor de la cookie `JSESSIONID`
6. Actualizar en `config/cameras.js` línea 19

### Agregar Más Cámaras
1. Identificar el ID de la cámara en Hik-Connect
2. Agregar entrada en el objeto `CAMERAS` en `config/cameras.js`:
```javascript
4: {
  id: 'nuevo-id-de-camara',
  name: 'Cámara 4'
}
```

### URLs Firmadas de AWS S3
Las URLs en `picUrl` tienen un tiempo de expiración (`X-Amz-Expires=1800` = 30 minutos).
Si necesitas almacenar imágenes por más tiempo, debes descargarlas y guardarlas localmente.

## Testing Manual Realizado

Durante la implementación se probó:
1. ✅ Servidor inicia correctamente en puerto 3000
2. ✅ Endpoint `/` retorna información correcta
3. ✅ Endpoint `/camera/1` retorna URL de imagen válida
4. ✅ Respuestas tienen formato JSON correcto
5. ✅ Headers de autenticación se envían correctamente

## Posibles Mejoras Futuras

1. **Variables de entorno**: Mover JSESSIONID y configuración a archivo `.env`
2. **Refresh automático de token**: Implementar login automático cuando expire la sesión
3. **Cache**: Cachear URLs por algunos minutos para reducir peticiones
4. **Rate limiting**: Limitar cantidad de peticiones por minuto
5. **Logging**: Implementar logger (winston, pino) para debugging
6. **Tests**: Agregar tests unitarios y de integración (Jest, Mocha)
7. **Docker**: Containerizar la aplicación
8. **Health check**: Endpoint `/health` para monitoreo
9. **Metrics**: Prometheus metrics para observabilidad

## Comandos Útiles

```bash
# Instalar dependencias
npm install

# Iniciar servidor
npm start

# Desarrollo con auto-reload
npm run dev

# Probar endpoints
curl http://localhost:3000/
curl http://localhost:3000/cameras
curl http://localhost:3000/camera/1
curl http://localhost:3000/camera/1?download=true -o camera1.jpg

# Detener servidor (si corre en background)
pkill -f "node index.js"
```

## Información de Contacto del Proyecto

- **Ubicación**: `/Users/damian/projects/lab/cameras`
- **Puerto por defecto**: 3000
- **Última actualización**: 2026-03-08
- **Servidor corriendo**: background task ID `bed8db2`

## Referencias

- [Express Documentation](https://expressjs.com/)
- [Axios Documentation](https://axios-http.com/)
- [Hikvision Hik-Connect](https://www.hik-connect.com/)
