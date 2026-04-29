import { CONFIG } from './config.js';
import { CameraManager } from './modules/camera.js';
import { FaceRecognizer } from './modules/faceRecognition.js';
import { EmotionService } from './modules/emotionService.js';
import { StorageManager } from './modules/storage.js';
import { Gamification } from './modules/gamification.js';
import { VoiceChecker } from './modules/voiceCheck.js';
import { AdminModule } from './modules/admin.js';

class App {
    constructor() {
        this.camera = new CameraManager();
        this.faceRecognizer = new FaceRecognizer();
        this.emotionService = new EmotionService();
        this.storage = new StorageManager();
        this.tempDescriptor = null;
        this.tempFoto = null;

        this.init();
    }

    async init() {
        // Aplicar tema A/B
        this.aplicarTema();

        // Iniciar cámaras
        await this.camera.iniciarCamara('videoRegistro');
        await this.camera.iniciarCamara('videoChecador');

        // Cargar modelos de reconocimiento facial
        await this.faceRecognizer.cargarModelos();
        this.faceRecognizer.actualizarMatcher(this.storage.getEmpleados());
        document.getElementById('modelStatus').innerText = '✅ Listo';

        // Verificar servidor YOLO
        this.verificarServidor();

        // Reloj
        setInterval(() => {
            document.getElementById('clock').innerText = new Date().toLocaleTimeString();
        }, 1000);

        // Actualizar puntos en UI
        Gamification.actualizarPuntosUI(this.storage.getPuntos());

        // Mostrar recomendación personal
        this.mostrarRecomendacionPersonal();

        // Exponer métodos globales para los onclick del HTML
        window.app = this;
    }

    aplicarTema() {
        const grupo = this.storage.getGrupoAB();
        const body = document.getElementById('appBody');
        const header = document.getElementById('mainHeader');
        if (grupo === 'pastel') {
            body.style.background = "#fce4ec";
            header.style.background = "#f48fb1";
        } else {
            body.style.background = "linear-gradient(135deg, #ff9800, #ff5722)";
            header.style.background = "#d32f2f";
        }
    }

    async verificarServidor() {
        const span = document.getElementById('yoloStatus');
        span.innerText = 'Conectando...';
        try {
            await fetch(`${CONFIG.SERVER_URL}/detect_emotions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: 'data:image/jpeg;base64,null' })
            });
            span.innerText = '✅ Activo';
        } catch(e) {
            span.innerText = '❌ No disponible';
        }
    }

    showSection(id) {
        document.querySelectorAll('.container').forEach(c => c.classList.add('hidden'));
        document.getElementById(id).classList.remove('hidden');
        if (id === 'adminPanel') {
            this.cargarRegistrosAdmin();
            this.cargarFiltrosAdmin();
            this.actualizarGraficoRadial();
            AdminModule.verificarAlertasEnfados(this.storage.getRegistros());
        }
    }

    // ---------- Registro de empleados ----------
    async capturarFotoRegistro() {
        const video = this.camera.getVideo('videoRegistro');
        if (!video) return alert('Cámara no lista');
        const descriptor = await this.faceRecognizer.obtenerDescriptor(video);
        if (!descriptor) {
            alert('No se detectó rostro');
            return;
        }
        this.tempDescriptor = descriptor;
        const canvas = await this.camera.capturarFrame(video);
        this.tempFoto = canvas.toDataURL();
        alert('Rostro capturado');
    }

    registrarEmpleado() {
        const nombre = document.getElementById('nombreEmpleado').value.trim();
        const horario = document.getElementById('horarioEmpleado').value;
        if (!nombre || !this.tempDescriptor) return alert('Nombre y foto requeridos');
        const numero = 'EMP' + Date.now();
        this.storage.addEmpleado({
            numero, nombre, horario,
            descriptor: this.tempDescriptor,
            foto: this.tempFoto
        });
        this.faceRecognizer.actualizarMatcher(this.storage.getEmpleados());
        alert('Empleado registrado');
        this.showSection('menuPrincipal');
        this.tempDescriptor = null;
    }

    // ---------- Asistencia ----------
    async tomarAsistencia(tipo) {
        const video = this.camera.getVideo('videoChecador');
        if (!video || !video.videoWidth) return alert('Cámara no lista');
        
        const emocion = await this.emotionService.detectarEmocion(video);
        document.getElementById('emocionBox').innerHTML = `🧠 Emoción: ${emocion}`;
        
        const empleado = await this.faceRecognizer.reconocerEmpleado(video, this.storage.getEmpleados());
        if (!empleado) {
            alert('No reconocido');
            return;
        }
        
        const hoy = new Date().toISOString().split('T')[0];
        const horaActual = new Date().toLocaleTimeString('es-MX', { hour12: false });
        let registros = this.storage.getRegistros();
        let reg = registros.find(r => r.numero === empleado.numero && r.fecha === hoy);
        
        if (tipo === 'entrada') {
            if (reg && reg.entrada) { alert('Ya registró entrada'); return; }
            if (!reg) {
                reg = {
                    numero: empleado.numero, nombre: empleado.nombre,
                    horario: empleado.horario, fecha: hoy,
                    entrada: horaActual, salida: '', emocion, estado: 'Presente'
                };
                this.storage.addRegistro(reg);
            } else {
                reg.entrada = horaActual;
                this.storage.updateRegistros(registros);
            }
            alert(`✅ Entrada ${empleado.nombre} - ${emocion}`);
        } else {
            if (!reg || !reg.entrada) { alert('Primero registra entrada'); return; }
            if (reg.salida) { alert('Salida ya registrada'); return; }
            reg.salida = horaActual;
            this.storage.updateRegistros(registros);
            alert(`✅ Salida ${empleado.nombre}`);
        }
        
        // Guardar emoción en historial
        this.storage.addEmocionHistorial({ nombre: empleado.nombre, fecha: hoy, emocion, tipo });
        
        // Gamificación
        if (emocion.includes('Feliz')) {
            this.storage.sumarPuntos(10);
            Gamification.actualizarPuntosUI(this.storage.getPuntos());
            alert('🎉 +10 puntos de positividad');
        }
        Gamification.mostrarMensajeAntiEstres(emocion);
        
        document.getElementById('resultado').innerHTML = `${empleado.nombre} - ${tipo} a las ${horaActual} - Emoción: ${emocion}`;
        this.mostrarRecomendacionPersonal();
    }

    // ---------- Voz ----------
    iniciarChequeoVoz() {
        VoiceChecker.iniciar(async (emocion, texto) => {
            alert(`Emoción por voz: ${emocion}\nTexto: "${texto}"`);
            if (this.storage.getEmpleados().length === 0) {
                alert('No hay empleados registrados');
                return;
            }
            const empleado = this.storage.getEmpleados()[0]; // simplificado
            const hoy = new Date().toISOString().split('T')[0];
            const hora = new Date().toLocaleTimeString('es-MX', { hour12: false });
            const tipo = confirm('¿Registrar ENTRADA? (Aceptar = Entrada, Cancelar = Salida)') ? 'entrada' : 'salida';
            let registros = this.storage.getRegistros();
            let reg = registros.find(r => r.numero === empleado.numero && r.fecha === hoy);
            
            if (tipo === 'entrada') {
                if (reg && reg.entrada) alert('Ya tiene entrada');
                else if (!reg) {
                    this.storage.addRegistro({
                        numero: empleado.numero, nombre: empleado.nombre,
                        horario: empleado.horario, fecha: hoy,
                        entrada: hora, salida: '', emocion, estado: 'Presente'
                    });
                } else {
                    reg.entrada = hora;
                    this.storage.updateRegistros(registros);
                }
            } else {
                if (!reg || !reg.entrada) alert('No hay entrada previa');
                else {
                    reg.salida = hora;
                    this.storage.updateRegistros(registros);
                }
            }
            alert(`Registro por voz: ${tipo} - ${emocion}`);
        });
    }

    // ---------- Admin ----------
    loginAdmin() {
        const u = document.getElementById('usuarioAdmin').value;
        const p = document.getElementById('passAdmin').value;
        if (u === CONFIG.ADMIN_USER && p === CONFIG.ADMIN_PASS) {
            this.showSection('adminPanel');
        } else {
            alert('Credenciales incorrectas');
        }
    }

    cargarFiltrosAdmin() {
        const sel = document.getElementById('filtroEmpleado');
        sel.innerHTML = '<option value="">Todos</option>';
        this.storage.getEmpleados().forEach(e => {
            const op = document.createElement('option');
            op.value = e.numero;
            op.text = e.nombre;
            sel.appendChild(op);
        });
    }

    cargarRegistrosAdmin() {
        const mes = document.getElementById('filtroMes').value;
        const emp = document.getElementById('filtroEmpleado').value;
        let filtrados = this.storage.getRegistros().filter(r =>
            (!mes || r.fecha.startsWith(mes)) && (!emp || r.numero === emp)
        );
        const tbody = document.querySelector('#tablaRegistros tbody');
        tbody.innerHTML = '';
        filtrados.forEach(r => {
            tbody.innerHTML += `<tr>
                <td>${r.nombre}</td><td>${r.fecha}</td>
                <td>${r.entrada || '-'}</td><td>${r.salida || '-'}</td>
                <td>${r.emocion || '-'}</td>
                <td><button onclick="app.eliminarRegistro('${r.fecha}','${r.numero}')">🗑️</button></td>
            </tr>`;
        });
        document.getElementById('totalEmp').innerHTML = `Empleados<br>${this.storage.getEmpleados().length}`;
        document.getElementById('totalAsis').innerHTML = `Asistencias<br>${filtrados.length}`;
    }

    eliminarRegistro(fecha, numero) {
        let registros = this.storage.getRegistros().filter(r => !(r.fecha === fecha && r.numero === numero));
        this.storage.updateRegistros(registros);
        this.cargarRegistrosAdmin();
        this.actualizarGraficoRadial();
    }

    exportarExcel() {
        const ws = XLSX.utils.json_to_sheet(this.storage.getRegistros());
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Asistencias');
        XLSX.writeFile(wb, `asistencias_${new Date().toISOString().slice(0,10)}.xlsx`);
    }

    verResumenEmociones() {
        const stats = {};
        this.storage.getEmocionesHistorial().forEach(e => {
            const emo = e.emocion || 'Sin dato';
            stats[emo] = (stats[emo] || 0) + 1;
        });
        let msg = '📊 Emociones registradas:\n';
        for (let [k, v] of Object.entries(stats)) msg += `${k}: ${v}\n`;
        alert(msg);
    }

    actualizarGraficoRadial() {
        const ctx = document.getElementById('graficoRadial').getContext('2d');
        AdminModule.generarGraficoRadial(this.storage.getRegistros(), ctx);
    }

    async enviarResumenSlack() {
        await AdminModule.enviarResumenSlack(this.storage.getRegistros());
    }

    async capturarSelfieGrupal() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = async (ev) => {
                const faces = await this.emotionService.detectarEmocionDesdeImagen(ev.target.result);
                if (faces.length) {
                    const emociones = faces.map(f => f.emotion);
                    const felices = emociones.filter(e => e.includes('Feliz')).length;
                    alert(`Selfie grupal: ${faces.length} rostros. Felicidad: ${Math.round(felices/faces.length*100)}%`);
                    this.storage.addRegistro({
                        nombre: 'GRUPAL', fecha: new Date().toISOString().split('T')[0],
                        emocion: `Grupal: ${emociones.join(', ')}`, entrada: 'selfie'
                    });
                    this.cargarRegistrosAdmin();
                    this.actualizarGraficoRadial();
                } else alert('No se detectaron rostros');
            };
            reader.readAsDataURL(file);
        };
        input.click();
    }

    mostrarRecomendacionPersonal() {
        const empleados = this.storage.getEmpleados();
        if (!empleados.length) return;
        const emp = empleados[0];
        const misRegistros = this.storage.getRegistros().filter(r => r.numero === emp.numero);
        const diasCansancio = {};
        misRegistros.forEach(r => {
            if (r.emocion === 'Triste 😢' || r.emocion === 'Nervioso 😨') {
                const fecha = new Date(r.fecha);
                const dia = fecha.toLocaleDateString('es-ES', { weekday: 'long' });
                diasCansancio[dia] = (diasCansancio[dia] || 0) + 1;
            }
        });
        let recomendacion = '';
        if (diasCansancio['miércoles'] && diasCansancio['miércoles'] >= 2)
            recomendacion = 'Los miércoles tiendes a estar más cansado. ¿Programamos una reunión más temprano?';
        else if (diasCansancio['lunes'])
            recomendacion = 'Los lunes cuestan. ¡Ánimo! Tómate un café extra.';
        else
            recomendacion = '¡Sigue así! Recuerda hidratarte.';
        document.getElementById('recomendacionPersonal').innerHTML = `💡 Recomendación: ${recomendacion}`;
    }
}

// Inicializar la app cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
