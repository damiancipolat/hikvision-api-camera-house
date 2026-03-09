# API de Cámaras Hikvision

API REST simple para obtener imágenes de cámaras Hikvision a través de Hik-Connect.

## Instalación

```bash
npm install
```

## Configuración

Copia el archivo de ejemplo y completa tus valores:

```bash
cp .env.example .env
```

Variables disponibles en `.env`:

```env
PORT=3000

JSESSIONID=tu-session-id-aqui

CAMERA_1_ID=id-de-camara-1
CAMERA_2_ID=id-de-camara-2
CAMERA_3_ID=id-de-camara-3
```

### Obtener el JSESSIONID

El `JSESSIONID` es la cookie de sesión necesaria para autenticar las peticiones. Cuando expire:

1. Iniciar sesión en Hik-Connect en tu navegador
2. Abrir las DevTools (F12) → pestaña Network
3. Buscar peticiones a `hikcentralconnect.com`
4. Copiar el valor de la cookie `JSESSIONID`
5. Actualizar el valor en `.env`

### Obtener IDs de cámaras

Los IDs de cámara se encuentran en la plataforma Hik-Connect. Para agregar más cámaras, añade las variables `CAMERA_4_ID`, etc., en `.env` y registra la cámara en `config/cameras.js`.

## Uso

```bash
npm start
```

O para desarrollo con auto-reload:

```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3000`

## Endpoints

### GET `/`
Muestra información sobre los endpoints disponibles.

### GET `/cameras`
Obtiene las URLs de todas las cámaras.

**Respuesta:**
```json
{
  "success": true,
  "cameras": [
    {
      "camera": "1",
      "name": "Cámara 1",
      "picUrl": "https://...",
      "createTime": 1773022007207,
      "isEncrypt": 0
    }
  ]
}
```

### GET `/cameras?download=true`
Obtiene todas las imágenes en formato base64.

**Respuesta:**
```json
{
  "success": true,
  "cameras": [
    {
      "camera": "1",
      "name": "Cámara 1",
      "imageBase64": "...",
      "contentType": "image/jpeg",
      "createTime": 1773022007207
    }
  ]
}
```

### GET `/camera/:id`
Obtiene la URL de una cámara específica (1, 2 o 3).

**Ejemplo:** `GET /camera/1`

**Respuesta:**
```json
{
  "success": true,
  "camera": "1",
  "name": "Cámara 1",
  "picUrl": "https://...",
  "createTime": 1773022007207,
  "isEncrypt": 0
}
```

### GET `/camera/:id?download=true`
Descarga directamente la imagen de la cámara en formato JPEG.

**Ejemplo:** `GET /camera/1?download=true`

**Respuesta:** Imagen JPEG (binary)

## Estructura del Proyecto

```
hikvision-api-camera-house/
├── config/              # Configuraciones y constantes
├── controllers/         # Lógica de negocio
├── routes/              # Definición de endpoints
├── services/            # Servicios para APIs externas
├── .env                 # Variables de entorno (no se sube a git)
├── .env.example         # Plantilla de variables de entorno
└── index.js             # Punto de entrada
```

- **Routes**: Define los endpoints y los mapea a controladores
- **Controllers**: Maneja requests/responses y lógica de negocio
- **Services**: Capa de servicios para llamadas a APIs externas
- **Config**: Configuraciones centralizadas

## Tecnologías

- Node.js
- Express
- Axios
- dotenv
