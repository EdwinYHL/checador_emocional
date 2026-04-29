import { CONFIG } from '../config.js';

export class StorageManager {
    constructor() {
        this.empleados = this._load(CONFIG.STORAGE_KEYS.EMPLEADOS);
        this.registros = this._load(CONFIG.STORAGE_KEYS.REGISTROS);
        this.emocionesHistorial = this._load(CONFIG.STORAGE_KEYS.EMOCIONES);
        this.puntosPositividad = this._load(CONFIG.STORAGE_KEYS.PUNTOS) || 0;
        this.grupoAB = this._load(CONFIG.STORAGE_KEYS.GRUPO_AB) || (Math.random() < 0.5 ? 'pastel' : 'vibrante');
    }

    _load(key, defaultValue = []) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    }

    _save(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    // Empleados
    getEmpleados() { return this.empleados; }
    addEmpleado(emp) { this.empleados.push(emp); this._save(CONFIG.STORAGE_KEYS.EMPLEADOS, this.empleados); }
    updateEmpleados(empleados) { this.empleados = empleados; this._save(CONFIG.STORAGE_KEYS.EMPLEADOS, this.empleados); }
    
    // Registros
    getRegistros() { return this.registros; }
    addRegistro(reg) { this.registros.push(reg); this._save(CONFIG.STORAGE_KEYS.REGISTROS, this.registros); }
    updateRegistros(registros) { this.registros = registros; this._save(CONFIG.STORAGE_KEYS.REGISTROS, this.registros); }
    
    // Emociones historial
    addEmocionHistorial(emo) { this.emocionesHistorial.push(emo); this._save(CONFIG.STORAGE_KEYS.EMOCIONES, this.emocionesHistorial); }
    getEmocionesHistorial() { return this.emocionesHistorial; }
    
    // Puntos
    getPuntos() { return this.puntosPositividad; }
    sumarPuntos(puntos) { this.puntosPositividad += puntos; this._save(CONFIG.STORAGE_KEYS.PUNTOS, this.puntosPositividad); }
    
    // Grupo AB
    getGrupoAB() { return this.grupoAB; }
    setGrupoAB(grupo) { this.grupoAB = grupo; this._save(CONFIG.STORAGE_KEYS.GRUPO_AB, grupo); }
}
