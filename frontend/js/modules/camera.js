export class CameraManager {
    constructor() {
        this.stream = null;
        this.videoElements = {};
    }

    async iniciarCamara(idVideo) {
        if (!this.stream) {
            this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }
        const video = document.getElementById(idVideo);
        video.srcObject = this.stream;
        await video.play();
        this.videoElements[idVideo] = video;
        return video;
    }

    detenerCamara() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }

    getVideo(idVideo) {
        return this.videoElements[idVideo];
    }

    async capturarFrame(videoElement) {
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        canvas.getContext('2d').drawImage(videoElement, 0, 0);
        return canvas;
    }
}
