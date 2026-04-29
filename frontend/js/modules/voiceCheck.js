export class VoiceChecker {
    static iniciar(callbackEmocion) {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Navegador no compatible con voz');
            return;
        }
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'es-ES';
        recognition.interimResults = false;
        recognition.start();
        recognition.onresult = (event) => {
            const texto = event.results[0][0].transcript.toLowerCase();
            let emocion = 'Neutral 😐';
            if (texto.includes('feliz') || texto.includes('alegre')) emocion = 'Feliz 😊';
            else if (texto.includes('triste') || texto.includes('mal')) emocion = 'Triste 😢';
            else if (texto.includes('enojado') || texto.includes('molesto')) emocion = 'Molesto 😠';
            else if (texto.includes('asustado') || texto.includes('miedo')) emocion = 'Nervioso 😨';
            callbackEmocion(emocion, texto);
        };
        recognition.onerror = () => alert('No se entendió la voz');
    }
}
