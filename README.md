# API de Cámaras Hikvision

API REST simple para obtener imágenes de cámaras Hikvision a través de Hik-Connect.

## Instalación

```bash
npm install
```

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
    },
    ...
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
    },
    ...
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

## Configuración

### JSESSIONID

El `JSESSIONID` es necesario para autenticar las peticiones. Se encuentra configurado en `config/cameras.js`:

```javascript
const JSESSIONID = 'ea5c8080-1f8c-4770-8bf7-32dfd2934aa9';
```

**IMPORTANTE:** Esta cookie expira después de cierto tiempo. Cuando eso suceda, deberás:

1. Iniciar sesión en Hik-Connect en tu navegador
2. Abrir las DevTools (F12)
3. En la pestaña Network, buscar la cookie `JSESSIONID`
4. Actualizar el valor en `config/cameras.js`

### IDs de Cámaras

Las cámaras están configuradas en el objeto `CAMERAS` en `config/cameras.js`:

```javascript
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
```

Puedes agregar más cámaras siguiendo el mismo patrón.

## Estructura del Proyecto

```
cameras/
├── config/              # Configuraciones y constantes
├── controllers/         # Lógica de negocio
├── routes/             # Definición de endpoints
├── services/           # Servicios para APIs externas
└── index.js            # Punto de entrada
```

El proyecto sigue una arquitectura MVC modular:
- **Routes**: Define los endpoints y los mapea a controladores
- **Controllers**: Maneja requests/responses y lógica de negocio
- **Services**: Capa de servicios para llamadas a APIs externas
- **Config**: Configuraciones centralizadas

## Tecnologías

- Node.js
- Express
- Axios
