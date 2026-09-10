// API pública del módulo notifications.
// Otros módulos deben importar desde aquí, nunca desde internals.
export {
  enviarRecordatorioAsignacion,
  enviarConfirmacionAsignacion,
  getDestinatariosAsignacion,
  buscarAsignacionesParaRecordatorio,
} from './application/notificacionServicioService.js';
