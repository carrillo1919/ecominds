import { Empresa } from '../../../models/index.js';

const DEMO_RIF = 'J-000000001';

/**
 * Obtiene la empresa de demostración usada para que auditores/lectores recién
 * creados sin empresas asignadas puedan explorar el sistema en modo prueba.
 * La crea si aún no existe (idempotente).
 */
const getOrCreateDemoEmpresa = async () => {
  let demo = await Empresa.findOne({ where: { esDemo: true } });
  if (demo) return demo;

  demo = await Empresa.findOne({ where: { rif: DEMO_RIF } });
  if (demo) {
    demo.esDemo = true;
    await demo.save();
    return demo;
  }

  return Empresa.create({
    nombre: 'Empresa Demo (modo prueba)',
    rif: DEMO_RIF,
    sector: 'Demostración',
    actividad: 'Empresa de prueba para exploración del sistema',
    email: null,
    activo: true,
    esDemo: true,
  });
};

export { getOrCreateDemoEmpresa, DEMO_RIF };