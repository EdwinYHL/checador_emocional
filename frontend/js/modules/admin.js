import { CONFIG } from '../config.js';

export class AdminModule {
    static async enviarResumenSlack(registros) {
        const total = registros.length;
        const felices = registros.filter(r => r.emocion === 'Feliz 😊').length;
        const porcentaje = total ? Math.round(felices/total*100) : 0;
        const mensaje = `📋 Resumen diario: ${porcentaje}% emociones positivas. 💪 Total registros: ${total}`;
        try {
            const res = await fetch(`${CONFIG.SERVER_URL}/send_slack_summary`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: mensaje })
            });
            if (res.ok) alert('Enviado a Slack');
            else alert('Webhook no configurado');
        } catch(e) { alert('Error'); }
    }

    static verificarAlertasEnfados(registros) {
        const porHora = {};
        registros.forEach(r => {
            if (r.emocion === 'Molesto 😠' && r.entrada) {
                const hora = r.entrada.split(':')[0];
                const clave = `${r.fecha} ${hora}`;
                porHora[clave] = (porHora[clave] || 0) + 1;
            }
        });
        const hayAlerta = Object.values(porHora).some(v => v >= 3);
        document.getElementById('alertaEnfados').style.display = hayAlerta ? 'block' : 'none';
    }

    static generarGraficoRadial(registros, ctx) {
        const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        const emociones = ['Feliz 😊', 'Triste 😢', 'Molesto 😠', 'Neutral 😐', 'Nervioso 😨'];
        const dataPorDia = {};
        diasSemana.forEach(d => dataPorDia[d] = {});
        registros.forEach(r => {
            if (!r.fecha) return;
            const fecha = new Date(r.fecha);
            const dia = diasSemana[fecha.getDay() === 0 ? 6 : fecha.getDay() - 1];
            const emo = r.emocion;
            if (emociones.includes(emo)) dataPorDia[dia][emo] = (dataPorDia[dia][emo] || 0) + 1;
        });
        const datasets = emociones.map(emo => ({
            label: emo,
            data: diasSemana.map(d => dataPorDia[d][emo] || 0),
            borderWidth: 2,
            fill: true
        }));
        if (window.chartRadial) window.chartRadial.destroy();
        window.chartRadial = new Chart(ctx, {
            type: 'radar',
            data: { labels: diasSemana, datasets },
            options: { responsive: true, maintainAspectRatio: true }
        });
    }
}
