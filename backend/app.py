import cv2
import base64
import numpy as np
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from ultralytics import YOLO
from deepface import DeepFace
import os
import requests
from datetime import datetime

app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Configuración Slack (opcional - poner tu webhook real)
SLACK_WEBHOOK_URL = os.environ.get('SLACK_WEBHOOK', '')

print("Cargando YOLOv8n...")
model = YOLO('yolov8n.pt')
print("Modelo listo.")

def detect_emotion_from_face(face_img):
    try:
        result = DeepFace.analyze(face_img, actions=['emotion'], enforce_detection=False)
        if result and len(result) > 0:
            emotion = result[0]['dominant_emotion']
            mapping = {
                'happy': 'Feliz 😊', 'sad': 'Triste 😢', 'angry': 'Molesto 😠',
                'fear': 'Nervioso 😨', 'surprise': 'Sorprendido 😲', 'disgust': 'Incómodo 😖',
                'neutral': 'Neutral 😐'
            }
            return mapping.get(emotion, 'Neutral 😐')
    except Exception as e:
        print("DeepFace error:", e)
    return "No detectada"

@app.route('/')
def index():
    return send_from_directory('../frontend', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('../frontend', path)

@app.route('/detect_emotions', methods=['POST'])
def detect_emotions():
    data = request.get_json()
    if not data or 'image' not in data:
        return jsonify({'error': 'No image'}), 400
    img_data = data['image'].split(',')[1]
    img_bytes = base64.b64decode(img_data)
    np_arr = np.frombuffer(img_bytes, np.uint8)
    frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    results = model(frame)[0]
    faces = []
    for box in results.boxes:
        if int(box.cls[0]) == 0:
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            if (x2 - x1) < 50 or (y2 - y1) < 50:
                continue
            face_crop = frame[y1:y2, x1:x2]
            if face_crop.size == 0:
                continue
            emotion = detect_emotion_from_face(face_crop)
            faces.append({'bbox': [x1, y1, x2, y2], 'emotion': emotion})
    return jsonify({'faces': faces})

@app.route('/send_slack_summary', methods=['POST'])
def send_slack_summary():
    data = request.get_json()
    if not SLACK_WEBHOOK_URL:
        return jsonify({'error': 'No webhook configurado'}), 400
    message = data.get('message', 'Resumen de emociones')
    try:
        requests.post(SLACK_WEBHOOK_URL, json={'text': message})
        return jsonify({'status': 'enviado'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
