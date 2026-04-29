export class Gamification {
    static mostrarMensajeAntiEstres(emocion) {
        if (emocion.includes('Triste') || emocion.includes('Nervioso')) {
            const div = document.getElementById('msgAntiEstres');
            div.innerHTML = `😔 ¿Un respiro? <a href="https://www.youtube.com/watch?v=inpok4MKVLM" target="_blank">Tómate 2 minutos de meditación guiada</a>`;
        } else {
            document.getElementById('msgAntiEstres').innerHTML = '';
        }
    }

    static actualizarPuntosUI(puntos) {
        document.getElementById('puntosPositividad').innerText = puntos;
    }
}
