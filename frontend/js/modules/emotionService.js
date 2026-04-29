import { CONFIG } from '../config.js';

export class EmotionService {
    async detectarEmocion(videoElement) {
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        canvas.getContext('2d').drawImage(videoElement, 0, 0);
        const dataURL = canvas.toDataURL('image/jpeg', 0.8);
        try {
            const response = await fetch(`${CONFIG.SERVER_URL}/detect_emotions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: dataURL })
            });
            const result = await response.json();
            if (result.faces && result.faces.length > 0) {
                return result.faces[0].emotion;
            }
            return '😐 No rostro';
        } catch (error) {
            console.error('Error en servidor emociones:', error);
            return '⚠️ Error conexión';
        }
    }

    async detectarEmocionDesdeImagen(dataURL) {
        try {
            const response = await fetch(`${CONFIG.SERVER_URL}/detect_emotions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: dataURL })
            });
            const result = await response.json();
            return result.faces || [];
        } catch (error) {
            console.error(error);
            return [];
        }
    }
}
