import { CONFIG } from '../config.js';

export class FaceRecognizer {
    constructor() {
        this.faceMatcher = null;
        this.modelsLoaded = false;
    }

    async cargarModelos() {
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(CONFIG.MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(CONFIG.MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(CONFIG.MODEL_URL)
        ]);
        this.modelsLoaded = true;
    }

    actualizarMatcher(empleados) {
        if (!empleados.length) {
            this.faceMatcher = null;
            return;
        }
        const labeledDescriptors = empleados
            .filter(e => e.descriptor)
            .map(e => new faceapi.LabeledFaceDescriptors(e.numero, [new Float32Array(e.descriptor)]));
        if (labeledDescriptors.length) {
            this.faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, CONFIG.RECOGNITION_THRESHOLD);
        } else {
            this.faceMatcher = null;
        }
    }

    async reconocerEmpleado(videoElement, empleados) {
        if (!this.modelsLoaded || !this.faceMatcher) return null;
        const canvas = await this._videoToCanvas(videoElement);
        const detection = await faceapi.detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions()).withFaceDescriptor();
        if (!detection) return null;
        const bestMatch = this.faceMatcher.findBestMatch(detection.descriptor);
        if (bestMatch.label !== 'unknown') {
            return empleados.find(e => e.numero === bestMatch.label);
        }
        return null;
    }

    async obtenerDescriptor(videoElement) {
        const canvas = await this._videoToCanvas(videoElement);
        const detection = await faceapi.detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions()).withFaceDescriptor();
        if (!detection) return null;
        return Array.from(detection.descriptor);
    }

    async _videoToCanvas(videoElement) {
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        canvas.getContext('2d').drawImage(videoElement, 0, 0);
        return canvas;
    }
}
