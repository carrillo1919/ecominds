// filepath: c:\Users\tf carrillo\Documents\proyectos\ecoMinds\backend\tools\migrations\20261001000001-reset-indices-y-datos-demo.js
// 20261001000001-reset-indices-y-datos-demo.js
'use strict';

import { QueryTypes } from 'sequelize';

/**
 * Tablas que SÍ se limpian. Se listan variantes (snake_case y PascalCase)
 * porque Sequelize crea ciertas tablas en PascalCase ("Empresas", "Productos").
 * Las que no existan simplemente se omiten.
 * TRUNCATE ... CASCADE arrastra las hijas automáticamente.
 */
const CANDIDATAS_A_REINICIAR = [
  'Empresas',
  'EmpresaServicios',
  'empresa_requisitos',
  'CalendarioEventos',
  'calendario_eventos',
  'CalendarioRelaciones',
  'calendario_relaciones',
  'NotificacionConfigs',
  'notificacion_configs',
  'NotificacionLogs',
  'notificacion_logs',
  'Productos',
  'Servicios',
  'Facturas',
];

/**
 * Tablas que JAMÁS se deben perder.
 * Si el CASCADE las alcanza, la migración ABORTA SIEMPRE (sin override).
 */
const TABLAS_PROTEGIDAS = [
  'Users',
  'auditoria_items',
  'auditoria_modulos',
  'auditoria_modules',
  'configuracion_facturas',
];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

async function tablaExiste(sequelize, tabla) {
  const rows = await sequelize.query(
    `SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = :tabla LIMIT 1`,
    { replacements: { tabla }, type: QueryTypes.SELECT }
  );
  return rows.length > 0;
}

/**
 * Devuelve todas las tablas que TRUNCATE ... CASCADE borraría.
 * Dirección correcta: desde las tablas objetivo hacia sus HIJOS
 * (tablas que las referencian con FK), recursivamente.
 */
async function tablasAfectadasPorCascada(sequelize, tablas) {
  if (!tablas.length) return [];

  const rows = await sequelize.query(
    `WITH RECURSIVE dep(tabla) AS (
       SELECT cl.relname
       FROM pg_class cl
       WHERE cl.relname IN (:tablas)

       UNION

       SELECT child.relname
       FROM pg_constraint  c
       JOIN pg_class child  ON child.oid  = c.conrelid
       JOIN pg_class parent ON parent.oid = c.confrelid
       JOIN dep d ON d.tabla = parent.relname
       WHERE c.contype = 'f'
     )
     SELECT DISTINCT tabla FROM dep ORDER BY tabla`,
    { replacements: { tablas }, type: QueryTypes.SELECT }
  );

  return rows.map((r) => r.tabla);
}

/* ------------------------------------------------------------------ */
/* UP                                                                  */
/* ------------------------------------------------------------------ */

export const up = async (queryInterface) => {
  const { sequelize } = queryInterface;

  // Guard 1: gate de "estás seguro" en producción
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DESTRUCTIVE_SEED !== 'true') {
    throw new Error(
      '[reset-indices] Operación destructiva bloqueada en producción. ' +
      'Define ALLOW_DESTRUCTIVE_SEED=true solo si estás seguro.'
    );
  }

  // 1) Resolver tablas existentes (sin duplicados)
  const existentes = [];
  for (const tabla of CANDIDATAS_A_REINICIAR) {
    if (await tablaExiste(sequelize, tabla)) {
      if (!existentes.includes(tabla)) existentes.push(tabla);
    } else {
      console.warn(`[reset-indices] Tabla "${tabla}" no existe, se omite.`);
    }
  }

  // 2) Guard 2 (SIEMPRE activo): el CASCADE no debe tocar tablas protegidas
  if (existentes.length > 0) {
    const afectadas = await tablasAfectadasPorCascada(sequelize, existentes);
    console.log(
      `[reset-indices] El CASCADE afectaría (${afectadas.length}): ${afectadas.join(', ') || '(nada)'}`
    );

    const violadas = afectadas.filter((t) => TABLAS_PROTEGIDAS.includes(t));
    if (violadas.length > 0) {
      throw new Error(
        `[reset-indices] ABORTADO: el CASCADE borraría tablas protegidas -> ${violadas.join(', ')}.\n` +
        'Soluciones:\n' +
        '  a) Saca de CANDIDATAS_A_REINICIAR la tabla origen de esa FK.\n' +
        '  b) Cambia la FK a ON DELETE SET NULL.\n' +
        '  c) Si la FK viene de auditoria_items, no la toques: revisa qué tabla la origina.'
      );
    }
  }

  // 3) Truncar raíces (hijas caen por CASCADE, incluye RESTART IDENTITY)
  for (const tabla of existentes) {
    await sequelize.query(
      `TRUNCATE TABLE "${tabla}" RESTART IDENTITY CASCADE`,
      { type: QueryTypes.RAW }
    );
    console.log(`[reset-indices] Truncada: "${tabla}"`);
  }
};

/* ------------------------------------------------------------------ */
/* DOWN                                                                */
/* ------------------------------------------------------------------ */

export const down = async () => {
  // No hay rollback real de un TRUNCATE.
  // Para restaurar, vuelve a correr las seeders.
};