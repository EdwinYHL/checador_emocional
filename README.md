# SAIK - Checador Emocional con YOLO y Face-API

Sistema de checador de asistencia que combina reconocimiento facial (Face-API.js) y detección de emociones en tiempo real (YOLOv8 + DeepFace). Incluye panel administrativo, gamificación, alertas por emociones negativas, recomendaciones contextuales, integración con Slack, selfie grupal y chequeo por voz.

## Características

- Registro de empleados con descriptor facial.
- Checada de entrada/salida con detección de emociones (feliz, triste, molesto, etc.).
- Puntos de positividad por emociones felices.
- Mensaje antiestrés si se detecta tristeza o miedo.
- Panel admin con gráfico radial de tendencias semanales, alerta de 3+ enfados por hora.
- Exportación a Excel.
- Resumen emocional.
- Selfie grupal (subir foto y detectar emociones de todos).
- Chequeo por voz (reconocimiento de emociones por palabras).
- Prueba A/B de interfaz (pastel vs vibrante).
- Envío de resumen diario a Slack (webhook configurable).

## Tecnologías

- **Backend**: Flask, YOLOv8, DeepFace, OpenCV.
- **Frontend**: HTML5, CSS3, JavaScript (ES6 modules), Face-API.js, Chart.js, SheetJS.

## Instalación

1. Clona o descarga el proyecto.
2. Instala dependencias de Python:
   ```bash
   cd backend
   pip install -r requirements.txt

   python app.py
3. Abre http://localhost:5000 en tu navegador.
