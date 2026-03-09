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
hikvision-api-camera-house/
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
├── .env                        # Variables de entorno (no se sube a git)
├── .env.example                # Plantilla de variables de entorno
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
- **dotenv**: Carga de variables de entorno desde `.env`
- **Node.js**: Runtime de JavaScript

### 2. Conversión de CURL a Axios

Los curls originales tenían la siguiente estructura:
```bash
curl 'https://isa-team.hikcentralconnect.com/hcc/resource/v1/logicalresource/element/camera/{CAMERA_ID}/thumbnail?refresh=1&&needEncrypt=1'
  -H 'cookie: JSESSIONID=<session-id>'
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

Las cámaras se configuran mediante variables de entorno en `.env`:

```env
CAMERA_1_ID=id-de-camara-1
CAMERA_2_ID=id-de-camara-2
CAMERA_3_ID=id-de-camara-3
```

Estas se consumen en `config/cameras.js`:

```javascript
const CAMERAS = {
  1: { id: process.env.CAMERA_1_ID, name: 'Cámara 1' },
  2: { id: process.env.CAMERA_2_ID, name: 'Cámara 2' },
  3: { id: process.env.CAMERA_3_ID, name: 'Cámara 3' }
};
```

Los IDs son identificadores únicos de cada cámara en el sistema Hikvision.

### 4. Autenticación

El `JSESSIONID` se carga desde la variable de entorno `JSESSIONID` en `.env`:

```javascript
const JSESSIONID = process.env.JSESSIONID;
```

- Es una cookie de sesión que expira después de cierto tiempo
- Debe actualizarse en `.env` cuando expire
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
    "picUrl": "https://...",
    "isEncrypt": 0,
    "createTime": 1773022007207
  },
  "errorCode": "0"
}
```

- **picUrl**: URL firmada con la imagen (expira después de 1800 segundos)
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
La URL base de la API de Hikvision está definida en `config/cameras.js` como `BASE_URL`.

## Scripts NPM

- `npm start`: Inicia el servidor en modo producción
- `npm run dev`: Inicia el servidor con nodemon (auto-reload en desarrollo)

## Dependencias

### Producción
- **express**: Framework web
- **axios**: Cliente HTTP
- **dotenv**: Carga de variables de entorno

### Desarrollo
- **nodemon**: Auto-reload durante desarrollo

## Notas de Mantenimiento

### Actualizar JSESSIONID
Cuando la sesión expire (los endpoints devuelven error de autenticación):
1. Abrir Hik-Connect en el navegador e iniciar sesión
2. Abrir DevTools (F12) → Network tab
3. Buscar peticiones a `hikcentralconnect.com`
4. Copiar el valor de la cookie `JSESSIONID`
5. Actualizar el valor en `.env`

### Agregar Más Cámaras
1. Identificar el ID de la cámara en Hik-Connect
2. Agregar la variable en `.env`:
```env
CAMERA_4_ID=nuevo-id-de-camara
```
3. Registrar la cámara en `config/cameras.js`:
```javascript
4: {
  id: process.env.CAMERA_4_ID,
  name: 'Cámara 4'
}
```

### URLs Firmadas
Las URLs en `picUrl` tienen un tiempo de expiración de 1800 segundos (30 minutos).
Si necesitas almacenar imágenes por más tiempo, debes descargarlas y guardarlas localmente.

## Testing Manual Realizado

Durante la implementación se probó:
1. ✅ Servidor inicia correctamente en puerto 3000
2. ✅ Endpoint `/` retorna información correcta
3. ✅ Endpoint `/camera/1` retorna URL de imagen válida
4. ✅ Respuestas tienen formato JSON correcto
5. ✅ Headers de autenticación se envían correctamente

## Posibles Mejoras Futuras

1. **Refresh automático de token**: Implementar login automático cuando expire la sesión
2. **Cache**: Cachear URLs por algunos minutos para reducir peticiones
3. **Rate limiting**: Limitar cantidad de peticiones por minuto
4. **Logging**: Implementar logger (winston, pino) para debugging
5. **Tests**: Agregar tests unitarios y de integración (Jest, Mocha)
6. **Docker**: Containerizar la aplicación
7. **Health check**: Endpoint `/health` para monitoreo
8. **Metrics**: Prometheus metrics para observabilidad

## Comandos Útiles

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Iniciar servidor
npm start

# Desarrollo con auto-reload
npm run dev

# Probar endpoints
curl http://localhost:3000/
curl http://localhost:3000/cameras
curl http://localhost:3000/camera/1
curl http://localhost:3000/camera/1?download=true -o camera1.jpg
```

## Referencias

- [Express Documentation](https://expressjs.com/)
- [Axios Documentation](https://axios-http.com/)
- [Hikvision Hik-Connect](https://www.hik-connect.com/)
