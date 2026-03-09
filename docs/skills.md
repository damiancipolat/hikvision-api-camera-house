---
name: camera-vision
description: "Captura y analiza imágenes de cámaras de seguridad conectadas via HTTP. Usa esta skill siempre que el usuario mencione 'cámara', 'cámaras', 'camera', 'qué se ve', 'hay alguien', 'revisar cámara', 'seguridad', 'vigilancia', 'movimiento', 'snapshot', 'captura', o cualquier referencia a monitoreo visual en tiempo real. No usar para imágenes subidas manualmente por el usuario — solo para capturas remotas vía HTTP."
---

# Camera Vision — Monitoreo de cámaras de seguridad

Skill para capturar imágenes desde cámaras IP y analizarlas con Claude, enfocado en detección de personas, movimiento y seguridad.

## Configuración

URL base del servidor de cámaras (editá cuando cambie el túnel ngrok):

**URL_BASE:** `xxxxxxxxxxxxxxx`

**Endpoint completo:** `{URL_BASE}/camera/1?download=true&base64=true`

## Formato de respuesta del servidor

El endpoint retorna JSON con esta estructura:

```json
{
  "success": true,
  "camera": "1",
  "name": "Cámara 1",
  "createTime": 1773027741159,
  "image": {
    "type": "base64",
    "media_type": "image/jpeg",
    "data": "<base64 de la imagen>"
  }
}
```

## Flujo

Cuando el usuario pida ver o analizar la cámara:

1. Hacé un request GET al endpoint completo.
2. Verificá que `success` sea `true`. Si no, informá el error.
3. Tomá el campo `image.data` (base64) y `image.media_type`.
4. Enviá esa imagen al modelo de Claude como input visual junto con el prompt de análisis.
5. Respondé al usuario con el resultado en español.

## Prompt de análisis por defecto (seguridad)

Cuando el usuario no especifique qué analizar, usá este prompt al enviar la imagen:

> Analizá esta imagen de una cámara de seguridad. Reportá en español y sé conciso:
>
> 1. Personas: ¿Hay personas visibles? ¿Cuántas? ¿Qué están haciendo?
> 2. Actividad sospechosa: ¿Se ve algo inusual o potencialmente peligroso?
> 3. Vehículos: ¿Hay vehículos visibles? Descripción breve.
> 4. Estado general: ¿La escena se ve normal? ¿Hay buena visibilidad?
>
> Si no hay nada relevante, decilo en una línea.

Si el usuario pide algo específico (ej: "¿hay un paquete en la puerta?", "¿está lloviendo?"), adaptá o complementá el prompt con lo que pida.

## Manejo de errores

- **Conexión fallida o timeout**: Informar que el servidor de cámaras no responde. Sugerir verificar que ngrok esté corriendo.
- **success: false**: Mostrar el error que devuelve el servidor.
- **Imagen vacía o corrupta**: Informar que la captura no devolvió una imagen válida.

## Ejemplos de uso

- "¿hay alguien en la cámara?" → Capturar + analizar con prompt de seguridad
- "qué se ve?" → Capturar + analizar con prompt de seguridad
- "¿está lloviendo?" → Capturar + analizar con prompt adaptado sobre clima
- "revisá la cámara y avisame si hay algo raro" → Capturar + analizar con prompt de seguridad