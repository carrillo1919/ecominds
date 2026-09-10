import cron from 'node-cron';
import logger from '../../../shared/observability/logger.js';
import {
  buscarAsignacionesParaRecordatorio,
  enviarRecordatorioAsignacion,
} from '../../notificaciones/index.js';

const RANGOS_DIAS = [7, 3, 1];

export const runServiciosRecordatorioJob = async () => {
  let enviados = 0;

  for (const dias of RANGOS_DIAS) {
    const asignaciones = await buscarAsignacionesParaRecordatorio(dias);
    for (const asignacion of asignaciones) {
      const responsableEmail = asignacion.empresa?.responsableEmpleado?.email;
      const adminEmail = process.env.ADMIN_EMAIL;
      const destinatarios = [adminEmail].filter(Boolean);
      if (responsableEmail) destinatarios.push(responsableEmail);

      for (const destinatario of destinatarios) {
        const resultado = await enviarRecordatorioAsignacion(asignacion, dias, destinatario);
        if (resultado.success) enviados += 1;
      }
    }
  }

  return { enviados, tipo: 'servicio_recordatorio' };
};

const serviciosRecordatorioJob = () => {
  cron.schedule('0 9 * * *', async () => {
    logger.info('[cron] Ejecutando job de recordatorios de servicios/productos...');
    try {
      const resultado = await runServiciosRecordatorioJob();
      logger.info({ event: 'job_servicios_recordatorio_completed', enviados: resultado.enviados });
    } catch (error) {
      logger.error({ event: 'job_servicios_recordatorio_error', error: error.message, stack: error.stack });
    }
  });
};

export default serviciosRecordatorioJob;