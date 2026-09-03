import 'dotenv/config';

import {
  sendEmail,
  verifyEmailConnection,
  sendVerificationEmail,
  sendResetPasswordEmail,
} from '../src/services/emailService.js';

import { notificarDocumentoCargado } from '../src/controllers/documentoController.js';
import { notificarAuditoriaFinalizada } from '../src/controllers/auditoriaController.js';
import { runDocumentosVencimientoJob } from '../src/jobs/documentosVencimientoJob.js';
import { runAuditoriaHoyJob } from '../src/jobs/auditoriaHoyJob.js';

import {
  Documento,
  Auditoria,
  NotificacionLog,
  sequelize,
} from '../src/models/index.js';

const resultados = [];

const test = async (nombre, fn) => {
  try {
    console.log(`\n▶️  ${nombre}`);
    const resultado = await fn();
    console.log(`✅ ${nombre}${resultado ? `: ${resultado}` : ''}`);
    resultados.push({ nombre, estado: 'OK' });
  } catch (error) {
    console.error(`❌ ${nombre}: ${error.message}`);
    resultados.push({ nombre, estado: 'FALLÓ', error: error.message });
  }
};

// Dirección fija para todas las pruebas de correo
const TEST_EMAIL = 'ecominds04@gmail.com';

console.log('============================================');
console.log('🧪  EcoMinds — Test de envío de correos');
console.log(`📧  Correo de prueba: ${TEST_EMAIL}`);
console.log('============================================');

try {
  await sequelize.authenticate();
  console.log('✅ Conexión a base de datos establecida');

  // 1. Verificar conexión SMTP
  await test('Verificar conexión SMTP', verifyEmailConnection);

  // 2. Correo genérico
  await test('Enviar correo genérico', async () => {
    const result = await sendEmail({
      to: TEST_EMAIL,
      subject: '[EcoMinds Test] Correo genérico',
      html: '<p>Este es un correo de prueba desde <strong>EcoMinds</strong>.</p>',
    });
    if (!result.success) throw new Error(result.error);
    return `messageId=${result.messageId}`;
  });

  // 3. Correo de verificación de cuenta
  await test('Enviar correo de verificación de cuenta', async () => {
    await sendVerificationEmail(
      { nombre: 'Usuario de Prueba', email: TEST_EMAIL },
      'token-de-prueba-12345'
    );
    return 'enviado';
  });

  // 4. Correo de recuperación de contraseña
  await test('Enviar correo de recuperación de contraseña', async () => {
    await sendResetPasswordEmail(
      { nombre: 'Usuario de Prueba', email: TEST_EMAIL },
      'token-reset-12345'
    );
    return 'enviado';
  });

  // 5. Notificación de documento cargado
  await test('Notificar documento cargado', async () => {
    const documento = await Documento.findOne({ order: [['createdAt', 'DESC']] });
    if (!documento) throw new Error('No hay documentos en la base de datos');
    await notificarDocumentoCargado(documento);
    return `documentoId=${documento.id}`;
  });

  // 6. Notificación de auditoría finalizada
  await test('Notificar auditoría finalizada', async () => {
    const auditoria = await Auditoria.findOne({ order: [['createdAt', 'DESC']] });
    if (!auditoria) throw new Error('No hay auditorías en la base de datos');
    await notificarAuditoriaFinalizada(auditoria);
    return `auditoriaId=${auditoria.id}`;
  });

  // 7. Job de vencimientos (ejecución manual)
  await test('Job de vencimientos de documentos', async () => {
    const antes = await NotificacionLog.count({ where: { tipo: 'documento_vencimiento' } });
    const resultado = await runDocumentosVencimientoJob();
    const despues = await NotificacionLog.count({ where: { tipo: 'documento_vencimiento' } });
    return `enviados=${resultado.enviados}, logs antes=${antes}, logs después=${despues}`;
  });

  // 8. Job de auditorías del día (ejecución manual)
  await test('Job de auditorías del día', async () => {
    const antes = await NotificacionLog.count({ where: { tipo: 'auditoria' } });
    const resultado = await runAuditoriaHoyJob();
    const despues = await NotificacionLog.count({ where: { tipo: 'auditoria' } });
    return `enviados=${resultado.enviados}, logs antes=${antes}, logs después=${despues}`;
  });

  console.log('\n============================================');
  console.log('📊 Resultados del test');
  console.log('============================================');
  console.table(resultados);

  const fallos = resultados.filter((r) => r.estado === 'FALLÓ');
  if (fallos.length) {
    console.error(`\n⚠️  ${fallos.length} prueba(s) fallaron`);
    process.exit(1);
  }

  console.log('\n🎉 Todas las pruebas de correo pasaron correctamente');
  process.exit(0);
} catch (error) {
  console.error('\n💥 Error general del test:', error.message);
  process.exit(1);
}