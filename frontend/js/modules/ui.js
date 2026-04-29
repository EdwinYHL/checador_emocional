// Funciones auxiliares de UI que no pertenecen a una clase específica
export function showSection(sectionId) {
    document.querySelectorAll('.container').forEach(c => c.classList.add('hidden'));
    document.getElementById(sectionId).classList.remove('hidden');
}

export function actualizarReloj() {
    const clockDiv = document.getElementById('clock');
    if (clockDiv) {
        clockDiv.innerText = new Date().toLocaleTimeString();
    }
}

export function mostrarMensaje(elementId, mensaje, esError = false) {
    const el = document.getElementById(elementId);
    if (el) {
        el.innerHTML = mensaje;
        if (esError) el.style.color = 'red';
        else el.style.color = '';
        setTimeout(() => {
            if (el.innerHTML === mensaje) el.innerHTML = '';
        }, 3000);
    }
}
