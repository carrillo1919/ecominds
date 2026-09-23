// 20261001000002-empresa-prueba-venezuela.js
'use strict';

import bcrypt from 'bcryptjs';
import { QueryTypes } from 'sequelize';

const SALT_ROUNDS = 10;

const RESPONSABLE = {
  nombre: 'Responsable',
  apellido: 'Venezuela',
  email: 'responsable.ve@srcd.local',
  password: 'Cacn1911.',
  rol: 'responsable',
};

const EMPLEADO_RESPONSABLE = {
  nombre: 'Responsable',
  apellido: 'Venezuela',
  cedula: 'V-12345678',
  cargo: 'Responsable de Cumplimiento Ambiental',
  email: 'responsable.ve@srcd.local',
  telefono: '+58 412-0000000',
};

const EMPRESA = {
  nombre: 'Empresa Prueba Venezuela, C.A.',
  rif: 'J-99999999-9',
  sector: 'Servicios',
  actividad: 'Consultoría y cumplimiento normativo ambiental',
  email: 'contacto@empresaprueba.com.ve',
  telefono: '+58 212-0000000',
  direccion: 'Av. Universidad, Caracas, Distrito Capital',
};

/**
 * Entes reguladores reales de Venezuela.
 * ambito: nacional | estadal | municipal
 */
const ENTES = [
  { nombre: 'Servicio Nacional Integrado de Administración Aduanera y Tributaria', sigla: 'SENIAT', ambito: 'nacional', contacto: 'contacto@seniat.gob.ve', sitio_web: 'http://www.seniat.gob.ve', activo: true },
  { nombre: 'Servicio Autónomo de Registros y Notarías', sigla: 'SAREN', ambito: 'nacional', contacto: 'contacto@saren.gob.ve', sitio_web: 'http://www.saren.gob.ve', activo: true },
  { nombre: 'Ministerio del Poder Popular para el Ecosocialismo', sigla: 'MINEC', ambito: 'nacional', contacto: 'contacto@minec.gob.ve', sitio_web: 'http://www.minec.gob.ve', activo: true },
  { nombre: 'Instituto Nacional de Prevención, Salud y Seguridad Laborales', sigla: 'INPSASEL', ambito: 'nacional', contacto: 'contacto@inpsasel.gob.ve', sitio_web: 'http://www.inpsasel.gob.ve', activo: true },
  { nombre: 'Instituto Venezolano de los Seguros Sociales', sigla: 'IVSS', ambito: 'nacional', contacto: 'contacto@ivss.gob.ve', sitio_web: 'http://www.ivss.gob.ve', activo: true },
  { nombre: 'Instituto Nacional de Capacitación y Educación Socialista', sigla: 'INCES', ambito: 'nacional', contacto: 'contacto@inces.gob.ve', sitio_web: 'http://www.inces.gob.ve', activo: true },
  { nombre: 'Ministerio del Poder Popular para el Proceso Social de Trabajo', sigla: 'MPPPST', ambito: 'nacional', contacto: 'contacto@mpppst.gob.ve', sitio_web: 'http://www.mpppst.gob.ve', activo: true },
  { nombre: 'Ministerio del Poder Popular para la Salud', sigla: 'MPPS', ambito: 'nacional', contacto: 'contacto@mpps.gob.ve', sitio_web: 'http://www.mpps.gob.ve', activo: true },
  { nombre: 'Servicio Autónomo Nacional de Normalización, Calidad, Metrología y Reglamentos Técnicos', sigla: 'SENCAMER', ambito: 'nacional', contacto: 'contacto@sencamer.gob.ve', sitio_web: 'http://www.sencamer.gob.ve', activo: true },
  { nombre: 'Superintendencia Nacional para la Defensa de los Derechos Socioeconómicos', sigla: 'SUNDDE', ambito: 'nacional', contacto: 'contacto@sundde.gob.ve', sitio_web: 'http://www.sundde.gob.ve', activo: true },
  { nombre: 'Dirección de Administración de Exoneraciones y Exenciones', sigla: 'DAEX', ambito: 'nacional', contacto: 'contacto@daex.gob.ve', sitio_web: 'http://www.daex.gob.ve', activo: true },
  { nombre: 'Instituto Nacional de Transporte Terrestre', sigla: 'INTT', ambito: 'nacional', contacto: 'contacto@intt.gob.ve', sitio_web: 'http://www.intt.gob.ve', activo: true },
  { nombre: 'Instituto Nacional de los Espacios Acuáticos', sigla: 'INEA', ambito: 'nacional', contacto: 'contacto@inea.gob.ve', sitio_web: 'http://www.inea.gob.ve', activo: true },
  { nombre: 'Comando Nacional Antiextorsión y Secuestro - Guardia Nacional Bolivariana', sigla: 'GNB-MAT-PEL', ambito: 'nacional', contacto: 'contacto@gnb.gob.ve', sitio_web: 'http://www.gnb.gob.ve', activo: true },
  { nombre: 'Hidrológica de la Región Capital, C.A.', sigla: 'HIDROCAPITAL', ambito: 'departamental', contacto: 'contacto@hidrocapital.gob.ve', sitio_web: 'http://www.hidrocapital.gob.ve', activo: true },
  { nombre: 'Corporación Eléctrica Nacional, S.A.', sigla: 'CORPOELEC', ambito: 'nacional', contacto: 'contacto@corpoelec.gob.ve', sitio_web: 'http://www.corpoelec.gob.ve', activo: true },
  { nombre: 'Cuerpo de Bomberos del Distrito Capital', sigla: 'BOMBEROS-DC', ambito: 'municipal', contacto: 'contacto@bomberos.gob.ve', sitio_web: 'http://www.bomberos.gob.ve', activo: true },
  { nombre: 'Protección Civil y Administración de Desastres - Distrito Capital', sigla: 'PC-DC', ambito: 'municipal', contacto: 'contacto@proteccioncivil.gob.ve', sitio_web: 'http://www.proteccioncivil.gob.ve', activo: true },
  { nombre: 'Alcaldía del Municipio Libertador', sigla: 'ALCALDIA-LIB', ambito: 'municipal', contacto: 'contacto@alcaldialibertador.gob.ve', sitio_web: 'http://www.alcaldialibertador.gob.ve', activo: true },
];

/**
 * Requisitos/documentos que cada ente exige a una empresa.
 * periodicidad: unica | mensual | trimestral | semestral | anual | bianual
 * criticidad:   alta | media | baja
 */
const REQUISITOS = [
  // --- SENIAT ---
  { sigla: 'SENIAT', codigo: 'VE-RIF-SENIAT', titulo: 'RIF - SENIAT', descripcion: 'Registro de Información Fiscal (RIF) vigente emitido por el SENIAT.', norma_respaldo: 'Providencia SNAT/2014/0030', categoria: 'Tributario', periodicidad: 'unica', criticidad: 'alta', vigencia_desde: '2026-01-01' },
  { sigla: 'SENIAT', codigo: 'VE-SENIAT-RENTA', titulo: 'Declaración Definitiva de Rentas', descripcion: 'Declaración anual de Impuesto sobre la Renta (Forma 02).', norma_respaldo: 'Ley de ISLR', categoria: 'Tributario', periodicidad: 'anual', criticidad: 'alta', vigencia_desde: '2026-01-01' },
  { sigla: 'SENIAT', codigo: 'VE-SENIAT-LIBROS', titulo: 'Libros de Compras y Ventas', descripcion: 'Libros de compras y ventas legalizados y al día.', norma_respaldo: 'Código Orgánico Tributario', categoria: 'Tributario', periodicidad: 'mensual', criticidad: 'media', vigencia_desde: '2026-01-01' },

  // --- SAREN ---
  { sigla: 'SAREN', codigo: 'VE-REG-MERCANTIL', titulo: 'Registro Mercantil', descripcion: 'Registro Mercantil de la empresa debidamente actualizado.', norma_respaldo: 'Código de Comercio', categoria: 'Legal', periodicidad: 'unica', criticidad: 'alta', vigencia_desde: '2026-01-01' },
  { sigla: 'SAREN', codigo: 'VE-SAREN-ESTATUTOS', titulo: 'Acta Constitutiva y Estatutos Sociales', descripcion: 'Documento constitutivo con últimas modificaciones protocolizadas.', norma_respaldo: 'Código de Comercio', categoria: 'Legal', periodicidad: 'unica', criticidad: 'alta', vigencia_desde: '2026-01-01' },
  { sigla: 'SAREN', codigo: 'VE-SAREN-ASAMBLEA', titulo: 'Última Acta de Asamblea', descripcion: 'Acta de la última asamblea de accionistas registrada.', norma_respaldo: 'Código de Comercio', categoria: 'Legal', periodicidad: 'anual', criticidad: 'media', vigencia_desde: '2026-01-01' },

  // --- MINEC (ambiental) ---
  { sigla: 'MINEC', codigo: 'VE-RACDA-MINEC', titulo: 'RACDA - MINEC', descripcion: 'Registro de Actividades Capaces de Degradar el Ambiente (RACDA) ante el MINEC.', norma_respaldo: 'Decreto 2635 (RACDA)', categoria: 'Ambiental', periodicidad: 'anual', criticidad: 'alta', vigencia_desde: '2026-01-01' },
  { sigla: 'MINEC', codigo: 'VE-MINEC-AFECTACION', titulo: 'Permiso de Afectación de Recursos Naturales', descripcion: 'Autorización de afectación de recursos naturales para actividades productivas.', norma_respaldo: 'Ley Orgánica del Ambiente', categoria: 'Ambiental', periodicidad: 'anual', criticidad: 'alta', vigencia_desde: '2026-01-01' },
  { sigla: 'MINEC', codigo: 'VE-MINEC-GENERADOR-PELIGROSOS', titulo: 'Registro de Generador de Desechos y Materiales Peligrosos', descripcion: 'Inscripción como generador de desechos peligrosos y su manejo.', norma_respaldo: 'Ley de Gestión Integral de la Basura / Decreto 2635', categoria: 'Ambiental', periodicidad: 'anual', criticidad: 'alta', vigencia_desde: '2026-01-01' },
  { sigla: 'MINEC', codigo: 'VE-MINEC-EFLUENTES', titulo: 'Permiso de Descarga de Efluentes', descripcion: 'Autorización de descarga de efluentes tratados a cuerpos de agua o alcantarillado.', norma_respaldo: 'Decreto 883 (Normas para vertidos)', categoria: 'Ambiental', periodicidad: 'anual', criticidad: 'alta', vigencia_desde: '2026-01-01' },
  { sigla: 'MINEC', codigo: 'VE-MINEC-EMISIONES', titulo: 'Autorización de Emisiones Atmosféricas', descripcion: 'Autorización y reporte de emisiones gaseosas y material particulado.', norma_respaldo: 'Decreto 638 (Calidad del aire)', categoria: 'Ambiental', periodicidad: 'anual', criticidad: 'media', vigencia_desde: '2026-01-01' },
  { sigla: 'MINEC', codigo: 'VE-MINEC-PMA', titulo: 'Plan de Manejo Ambiental', descripcion: 'Plan de manejo ambiental vigente con informe de cumplimiento.', norma_respaldo: 'Ley Orgánica del Ambiente', categoria: 'Ambiental', periodicidad: 'anual', criticidad: 'alta', vigencia_desde: '2026-01-01' },
  { sigla: 'MINEC', codigo: 'VE-MINEC-EIA', titulo: 'Estudio de Impacto Ambiental', descripcion: 'Estudio de impacto ambiental y socio-cultural según el proyecto.', norma_respaldo: 'Ley Orgánica del Ambiente', categoria: 'Ambiental', periodicidad: 'unica', criticidad: 'media', vigencia_desde: '2026-01-01' },

  // --- INPSASEL / SST ---
  { sigla: 'INPSASEL', codigo: 'VE-INPSASEL-REGEMPRESA', titulo: 'Registro Nacional de Empresas (INPSASEL)', descripcion: 'Inscripción de la empresa en el registro de INPSASEL.', norma_respaldo: 'LOPCYMAT', categoria: 'Seguridad y Salud Laboral', periodicidad: 'unica', criticidad: 'alta', vigencia_desde: '2026-01-01' },
  { sigla: 'INPSASEL', codigo: 'VE-INPSASEL-PSST', titulo: 'Programa de Seguridad y Salud en el Trabajo (PSST)', descripcion: 'PSST elaborado, aprobado y en ejecución.', norma_respaldo: 'LOPCYMAT', categoria: 'Seguridad y Salud Laboral', periodicidad: 'anual', criticidad: 'alta', vigencia_desde: '2026-01-01' },
  { sigla: 'INPSASEL', codigo: 'VE-INPSASEL-NOTIF-RIESGOS', titulo: 'Notificación de Riesgos', descripcion: 'Notificación de riesgos por puesto de trabajo al trabajador.', norma_respaldo: 'LOPCYMAT', categoria: 'Seguridad y Salud Laboral', periodicidad: 'anual', criticidad: 'media', vigencia_desde: '2026-01-01' },
  { sigla: 'INPSASEL', codigo: 'VE-INPSASEL-CSSL', titulo: 'Comité de Seguridad y Salud Laboral', descripcion: 'Constitución, registro y actas del Comité de Seguridad y Salud Laboral.', norma_respaldo: 'LOPCYMAT', categoria: 'Seguridad y Salud Laboral', periodicidad: 'anual', criticidad: 'alta', vigencia_desde: '2026-01-01' },
  { sigla: 'INPSASEL', codigo: 'VE-INPSASEL-SSST', titulo: 'Servicio de Seguridad y Salud en el Trabajo', descripcion: 'SSST conformado por personal calificado (medicina y seguridad ocupacional).', norma_respaldo: 'LOPCYMAT', categoria: 'Seguridad y Salud Laboral', periodicidad: 'anual', criticidad: 'alta', vigencia_desde: '2026-01-01' },

  // --- IVSS ---
  { sigla: 'IVSS', codigo: 'VE-IVSS-INSCRIPCION', titulo: 'Inscripción de Empresa (IVSS)', descripcion: 'Inscripción patronal y constancia de afiliación ante el IVSS.', norma_respaldo: 'Ley del Seguro Social', categoria: 'Laboral', periodicidad: 'unica', criticidad: 'media', vigencia_desde: '2026-01-01' },
  { sigla: 'IVSS', codigo: 'VE-IVSS-REMITIDAS', titulo: 'Declaración de Remitidas / Egresos', descripcion: 'Declaración mensual de nómina y movimientos de personal.', norma_respaldo: 'Ley del Seguro Social', categoria: 'Laboral', periodicidad: 'mensual', criticidad: 'media', vigencia_desde: '2026-01-01' },

  // --- INCES ---
  { sigla: 'INCES', codigo: 'VE-INCES-INSCRIPCION', titulo: 'Inscripción de Empresa (INCES)', descripcion: 'Inscripción patronal ante el INCES.', norma_respaldo: 'Ley del INCES', categoria: 'Laboral', periodicidad: 'unica', criticidad: 'baja', vigencia_desde: '2026-01-01' },
  { sigla: 'INCES', codigo: 'VE-INCES-APORTES', titulo: 'Aportes INCES (2% y 0,5%)', descripcion: 'Declaración y pago de aportes patronales y de aprendices.', norma_respaldo: 'Ley del INCES', categoria: 'Laboral', periodicidad: 'trimestral', criticidad: 'media', vigencia_desde: '2026-01-01' },

  // --- MPPPST ---
  { sigla: 'MPPPST', codigo: 'VE-MPPPST-SOLVENCIA', titulo: 'Solvencia Laboral', descripcion: 'Constancia de inscripción y solvencia en el Sistema de Registro de Empresas.', norma_respaldo: 'Ley Orgánica del Trabajo (LOTTT)', categoria: 'Laboral', periodicidad: 'semestral', criticidad: 'alta', vigencia_desde: '2026-01-01' },

  // --- MPPS (sanitario) ---
  { sigla: 'MPPS', codigo: 'VE-MPPS-PERMISO', titulo: 'Permiso Sanitario de Funcionamiento', descripcion: 'Autorización sanitaria de funcionamiento del establecimiento.', norma_respaldo: 'Ley Orgánica de Salud', categoria: 'Sanitario', periodicidad: 'anual', criticidad: 'alta', vigencia_desde: '2026-01-01' },
  { sigla: 'MPPS', codigo: 'VE-MPPS-CARNET-SALUD', titulo: 'Carnets de Salud del Personal', descripcion: 'Certificados de salud vigentes del personal que manipula alimentos/carga.', norma_respaldo: 'Ley Orgánica de Salud', categoria: 'Sanitario', periodicidad: 'anual', criticidad: 'media', vigencia_desde: '2026-01-01' },
  { sigla: 'MPPS', codigo: 'VE-MPPS-PLAGAS', titulo: 'Certificado de Control de Plagas', descripcion: 'Certificado de fumigación, desinsectación y desratización por empresa autorizada.', norma_respaldo: 'Ley Orgánica de Salud', categoria: 'Sanitario', periodicidad: 'trimestral', criticidad: 'media', vigencia_desde: '2026-01-01' },
  { sigla: 'MPPS', codigo: 'VE-MPPS-CALIDAD-AGUA', titulo: 'Análisis de Calidad de Agua', descripcion: 'Análisis fisicoquímico y bacteriológico de agua de consumo por laboratorio acreditado.', norma_respaldo: 'Normas COVENIN / Decreto 883', categoria: 'Sanitario', periodicidad: 'semestral', criticidad: 'alta', vigencia_desde: '2026-01-01' },

  // --- SENCAMER ---
  { sigla: 'SENCAMER', codigo: 'VE-SENCAMER-COVENIN', titulo: 'Certificado de Conformidad COVENIN', descripcion: 'Certificación de productos/servicios conforme a normas COVENIN aplicables.', norma_respaldo: 'Ley del Sistema Venezolano para la Calidad', categoria: 'Calidad', periodicidad: 'anual', criticidad: 'media', vigencia_desde: '2026-01-01' },

  // --- SUNDDE ---
  { sigla: 'SUNDDE', codigo: 'VE-SUNDDE-PRECIOS', titulo: 'Registro de Precios Justos', descripcion: 'Inscripción de productos y estructura de costos ante la SUNDDE.', norma_respaldo: 'Ley Orgánica de Precios Justos', categoria: 'Comercial', periodicidad: 'anual', criticidad: 'media', vigencia_desde: '2026-01-01' },

  // --- DAEX ---
  { sigla: 'DAEX', codigo: 'VE-RESQUIN-DAEX', titulo: 'Resquin - DAEX', descripcion: 'Registro de Solicitudes de Compras y Servicios (RESQUIN) ante la DAEX.', norma_respaldo: 'Providencia DAEX', categoria: 'Administrativo', periodicidad: 'unica', criticidad: 'media', vigencia_desde: '2026-01-01' },
  { sigla: 'DAEX', codigo: 'VE-DAEX-EXONERACION', titulo: 'Certificado de Exoneración', descripcion: 'Certificado de exoneración/exención de tributos aduaneros.', norma_respaldo: 'Providencia DAEX', categoria: 'Administrativo', periodicidad: 'anual', criticidad: 'baja', vigencia_desde: '2026-01-01' },

  // --- INTT ---
  { sigla: 'INTT', codigo: 'VE-INTT-FLOTA', titulo: 'Registro y Permiso de Flota Vehicular', descripcion: 'Documentación de vehículos de carga y permisos de circulación.', norma_respaldo: 'Ley de Transporte Terrestre', categoria: 'Transporte', periodicidad: 'anual', criticidad: 'media', vigencia_desde: '2026-01-01' },

  // --- INEA ---
  { sigla: 'INEA', codigo: 'VE-INEA-DESCARGA', titulo: 'Autorización de Descarga en Cuerpos de Agua', descripcion: 'Permiso acuático para descarga de efluentes y operaciones en zonas costeras.', norma_respaldo: 'Ley de Espacios Acuáticos', categoria: 'Ambiental', periodicidad: 'anual', criticidad: 'media', vigencia_desde: '2026-01-01' },

  // --- GNB ---
  { sigla: 'GNB-MAT-PEL', codigo: 'VE-GNB-MAT-PELIGROSOS', titulo: 'Permiso de Manejo de Materiales Peligrosos', descripcion: 'Autorización para almacenamiento, transporte y manejo de sustancias peligrosas.', norma_respaldo: 'Ley Orgánica de Sustancias, Materiales y Desechos Peligrosos', categoria: 'Seguridad', periodicidad: 'anual', criticidad: 'alta', vigencia_desde: '2026-01-01' },

  // --- HIDROCAPITAL ---
  { sigla: 'HIDROCAPITAL', codigo: 'VE-HIDROCAPITAL-VERTIDO', titulo: 'Permiso de Vertido a Alcantarillado', descripcion: 'Autorización y caracterización del vertido industrial al sistema de cloacas.', norma_respaldo: 'Decreto 883', categoria: 'Ambiental', periodicidad: 'anual', criticidad: 'media', vigencia_desde: '2026-01-01' },

  // --- CORPOELEC ---
  { sigla: 'CORPOELEC', codigo: 'VE-CORPOELEC-CONFORMIDAD', titulo: 'Certificado de Conformidad Eléctrica', descripcion: 'Inspección y certificación de instalaciones eléctricas y de puesta a tierra.', norma_respaldo: 'Código Eléctrico Nacional (COVENIN 200)', categoria: 'Seguridad', periodicidad: 'anual', criticidad: 'media', vigencia_desde: '2026-01-01' },

  // --- BOMBEROS ---
  { sigla: 'BOMBEROS-DC', codigo: 'VE-PERM-BOMBEROS', titulo: 'Permiso de Bomberos', descripcion: 'Permiso de funcionamiento y seguridad otorgado por el Cuerpo de Bomberos.', norma_respaldo: 'Ley de Bomberos', categoria: 'Seguridad', periodicidad: 'anual', criticidad: 'alta', vigencia_desde: '2026-01-01' },
  { sigla: 'BOMBEROS-DC', codigo: 'VE-BOMBEROS-EXTINTORES', titulo: 'Constancia de Extintores y Equipos Contra Incendio', descripcion: 'Recarga, mantenimiento y señalización de extintores según carga de fuego.', norma_respaldo: 'COVENIN 1040 / Ley de Bomberos', categoria: 'Seguridad', periodicidad: 'anual', criticidad: 'alta', vigencia_desde: '2026-01-01' },

  // --- Protección Civil ---
  { sigla: 'PC-DC', codigo: 'VE-PC-ANALISIS-RIESGO', titulo: 'Análisis de Riesgo y Estudio de Protección Civil', descripcion: 'Evaluación de amenazas, vulnerabilidades y planes de mitigación.', norma_respaldo: 'Ley de la Organización Nacional de Protección Civil', categoria: 'Seguridad', periodicidad: 'bianual', criticidad: 'alta', vigencia_desde: '2026-01-01' },
  { sigla: 'PC-DC', codigo: 'VE-PC-PLAN-EMERGENCIA', titulo: 'Plan de Emergencias y Evacuación', descripcion: 'Plan de evacuación, rutas, brigadas y registro de simulacros.', norma_respaldo: 'Ley de la Organización Nacional de Protección Civil', categoria: 'Seguridad', periodicidad: 'anual', criticidad: 'media', vigencia_desde: '2026-01-01' },

  // --- Alcaldía ---
  { sigla: 'ALCALDIA-LIB', codigo: 'VE-ALCALDIA-PATENTE', titulo: 'Patente de Industria y Comercio', descripcion: 'Registro de Actividades Económicas / licencia de funcionamiento municipal.', norma_respaldo: 'Ordenanza Municipal', categoria: 'Municipal', periodicidad: 'anual', criticidad: 'alta', vigencia_desde: '2026-01-01' },
  { sigla: 'ALCALDIA-LIB', codigo: 'VE-USO-CONFORME', titulo: 'Uso Conforme - Alcaldía', descripcion: 'Certificado de Uso Conforme otorgado por la Alcaldía correspondiente.', norma_respaldo: 'Ordenanza Municipal', categoria: 'Municipal', periodicidad: 'unica', criticidad: 'media', vigencia_desde: '2026-01-01' },
  { sigla: 'ALCALDIA-LIB', codigo: 'VE-HABITABILIDAD', titulo: 'Habitabilidad - Alcaldía', descripcion: 'Certificado de Habitabilidad emitido por la Alcaldía.', norma_respaldo: 'Ordenanza Municipal', categoria: 'Municipal', periodicidad: 'unica', criticidad: 'media', vigencia_desde: '2026-01-01' },
  { sigla: 'ALCALDIA-LIB', codigo: 'VE-VARIABLE-URBANISTICA', titulo: 'Constancia de Variable Urbanística', descripcion: 'Verificación de compatibilidad urbanística del uso del inmueble.', norma_respaldo: 'Ordenanza Municipal', categoria: 'Municipal', periodicidad: 'unica', criticidad: 'baja', vigencia_desde: '2026-01-01' },
];

/* ------------------------------------------------------------------ */
/* Helpers de ENUM (validan contra la BD real)                         */
/* ------------------------------------------------------------------ */

const cacheEnums = new Map();

async function valoresEnum(sequelize, tipoEnum) {
  if (!tipoEnum) return null;
  if (cacheEnums.has(tipoEnum)) return cacheEnums.get(tipoEnum);

  const rows = await sequelize.query(
    `SELECT e.enumlabel AS valor
       FROM pg_type t
       JOIN pg_enum e ON e.enumtypid = t.oid
      WHERE t.typname = :tipoEnum
      ORDER BY e.enumsortorder`,
    { replacements: { tipoEnum }, type: QueryTypes.SELECT }
  );

  const set = rows.length ? new Set(rows.map((r) => r.valor)) : null;
  cacheEnums.set(tipoEnum, set);
  return set;
}

function normalizarEnum(v) {
  return String(v)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita tildes
    .toLowerCase()
    .trim();
}

/**
 * Devuelve el valor del enum tal como existe en la BD.
 * - Si el tipo enum NO existe → lanza error (para no enmascarar el problema).
 * - Si el valor no existe pero hay `fallbacks` disponibles → usa el primero y avisa.
 * - Si no hay fallback → lanza error con la lista de valores válidos.
 */
async function adaptarEnum(sequelize, tipoEnum, valor, contexto, fallbacks = []) {
  const validos = await valoresEnum(sequelize, tipoEnum);

  if (!validos) {
    throw new Error(
      `El tipo enum "${tipoEnum}" no existe en la BD (${contexto}). ` +
      'Revisa el nombre en el seeder.'
    );
  }

  if (validos.has(valor)) return valor;

  const objetivo = normalizarEnum(valor);
  for (const v of validos) {
    if (normalizarEnum(v) === objetivo) return v;
  }

  for (const fb of fallbacks) {
    if (validos.has(fb)) {
      console.warn(`[seed] ${contexto}: "${valor}" no existe en ${tipoEnum}; se usó "${fb}".`);
      return fb;
    }
  }

  throw new Error(
    `Valor "${valor}" inválido para ${tipoEnum} (${contexto}).\n` +
    `Valores permitidos: ${[...validos].join(', ')}`
  );
}

/* ------------------------------------------------------------------ */
/* Helpers de inserción resiliente (solo columnas que existan)         */
/* ------------------------------------------------------------------ */

async function columnasDe(sequelize, tabla) {
  const rows = await sequelize.query(
    `SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = :tabla`,
    { replacements: { tabla }, type: QueryTypes.SELECT }
  );
  return new Set(rows.map((r) => r.column_name));
}

async function insertarFila(sequelize, tabla, fila, { returning = null, onConflict = false } = {}) {
  const cols = await columnasDe(sequelize, tabla);
  const keys = Object.keys(fila).filter((k) => cols.has(k));
  if (keys.length === 0) throw new Error(`No hay columnas válidas para insertar en "${tabla}"`);

  const sql =
    `INSERT INTO "${tabla}" (${keys.map((k) => `"${k}"`).join(', ')})\n` +
    `VALUES (${keys.map((k) => `:${k}`).join(', ')})\n` +
    (onConflict ? 'ON CONFLICT DO NOTHING\n' : '') +
    (returning ? `RETURNING "${returning}"` : '');

  const res = await sequelize.query(sql, { replacements: fila, type: QueryTypes.INSERT });
  if (!returning) return null;

  const primera = Array.isArray(res[0]) ? res[0][0] : res[0];
  return primera?.[returning] ?? null;
}

/* ------------------------------------------------------------------ */
/* UP                                                                  */
/* ------------------------------------------------------------------ */

export const up = async (queryInterface) => {
  const { sequelize } = queryInterface;
  const ts = { created_at: new Date(), updated_at: new Date() };

  // 1) Entes reguladores (idempotente por sigla)
  for (const ente of ENTES) {
    const ambito = await adaptarEnum(
      sequelize,
      'enum_entes_reguladores_ambito',
      ente.ambito,
      `ente ${ente.sigla}`,
      ['nacional']
    );

    await sequelize.query(
      `INSERT INTO entes_reguladores (id, nombre, sigla, ambito, contacto, sitio_web, activo, created_at, updated_at)
       VALUES (gen_random_uuid(), :nombre, :sigla, :ambito, :contacto, :sitio_web, :activo, NOW(), NOW())
       ON CONFLICT (sigla) DO NOTHING`,
      { replacements: { ...ente, ambito }, type: QueryTypes.INSERT }
    );
  }

  const entesDb = await sequelize.query(
    `SELECT id, sigla FROM entes_reguladores WHERE sigla IN (:siglas)`,
    { replacements: { siglas: ENTES.map((e) => e.sigla) }, type: QueryTypes.SELECT }
  );
  const bySigla = Object.fromEntries(entesDb.map((e) => [e.sigla, e.id]));

  const faltantes = REQUISITOS.filter((r) => !bySigla[r.sigla]);
  if (faltantes.length > 0) {
    throw new Error(`Entes reguladores no encontrados para: ${[...new Set(faltantes.map((r) => r.sigla))].join(', ')}`);
  }

  // 2) Requisitos legales (idempotente por ente_id + codigo)
  for (const r of REQUISITOS) {
    const periodicidad = await adaptarEnum(
      sequelize,
      'periodicidad_requisito',
      r.periodicidad,
      `requisito ${r.codigo}`,
      ['anual']
    );
    const criticidad = await adaptarEnum(
      sequelize,
      'criticidad_requisito',
      r.criticidad,
      `requisito ${r.codigo}`,
      ['media']
    );

    await sequelize.query(
      `INSERT INTO requisitos_legales
        (id, ente_id, codigo, titulo, descripcion, norma_respaldo, categoria, periodicidad, criticidad, vigencia_desde, activo, created_at, updated_at)
       VALUES
        (gen_random_uuid(), :ente_id, :codigo, :titulo, :descripcion, :norma_respaldo, :categoria, :periodicidad, :criticidad, :vigencia_desde, true, NOW(), NOW())
       ON CONFLICT (ente_id, codigo) DO NOTHING`,
      {
        replacements: { ...r, ente_id: bySigla[r.sigla], periodicidad, criticidad },
        type: QueryTypes.INSERT,
      }
    );
  }

  // 3) Usuario responsable (idempotente por email)
  const userExistente = await sequelize.query(
    `SELECT id FROM "Users" WHERE email = :email`,
    { replacements: { email: RESPONSABLE.email }, type: QueryTypes.SELECT }
  );

  if (!userExistente[0]?.id) {
    const hash = await bcrypt.hash(RESPONSABLE.password, SALT_ROUNDS);
    await sequelize.query(
      `INSERT INTO "Users"
        (id, nombre, apellido, email, password, rol, verified, "createdAt", "updatedAt")
       VALUES
        (gen_random_uuid(), :nombre, :apellido, :email, :password, :rol, true, NOW(), NOW())`,
      {
        replacements: {
          nombre: RESPONSABLE.nombre,
          apellido: RESPONSABLE.apellido,
          email: RESPONSABLE.email,
          password: hash,
          rol: RESPONSABLE.rol,
        },
        type: QueryTypes.INSERT,
      }
    );
  }

  // 4) Empresa de prueba (idempotente por RIF) — sin responsable todavía
  const empresaExistente = await sequelize.query(
    `SELECT id FROM "Empresas" WHERE rif = :rif`,
    { replacements: { rif: EMPRESA.rif }, type: QueryTypes.SELECT }
  );

  let empresaId = empresaExistente[0]?.id;

  if (!empresaId) {
    empresaId = await insertarFila(
      sequelize,
      'Empresas',
      {
        nombre: EMPRESA.nombre,
        rif: EMPRESA.rif,
        sector: EMPRESA.sector,
        actividad: EMPRESA.actividad,
        email: EMPRESA.email,
        telefono: EMPRESA.telefono,
        direccion: EMPRESA.direccion,
        responsable_id: null,
        activo: true,
        es_demo: true,
        created_at: ts.created_at,
        createdAt: ts.created_at,
        updated_at: ts.updated_at,
        updatedAt: ts.updated_at,
      },
      { returning: 'id' }
    );
  }

  // 5) Empleado responsable (Empresas.responsable_id -> Empleados.id)
  const empleadoExistente = await sequelize.query(
    `SELECT id FROM "Empleados" WHERE email = :email LIMIT 1`,
    { replacements: { email: EMPLEADO_RESPONSABLE.email }, type: QueryTypes.SELECT }
  );

  let empleadoId = empleadoExistente[0]?.id;

  if (!empleadoId && empresaId) {
    empleadoId = await insertarFila(
      sequelize,
      'Empleados',
      {
        empresa_id: empresaId,
        nombre: EMPLEADO_RESPONSABLE.nombre,
        apellido: EMPLEADO_RESPONSABLE.apellido,
        cedula: EMPLEADO_RESPONSABLE.cedula,
        cargo: EMPLEADO_RESPONSABLE.cargo,
        email: EMPLEADO_RESPONSABLE.email,
        telefono: EMPLEADO_RESPONSABLE.telefono,
        activo: true,
        created_at: ts.created_at,
        createdAt: ts.created_at,
        updated_at: ts.updated_at,
        updatedAt: ts.updated_at,
      },
      { returning: 'id' }
    );
  }

  if (empresaId && empleadoId) {
    await sequelize.query(
      `UPDATE "Empresas" SET responsable_id = :empleadoId WHERE id = :empresaId`,
      { replacements: { empleadoId, empresaId }, type: QueryTypes.UPDATE }
    );
  }

  // 6) Asignar requisitos a la empresa (idempotente por empresa_id + requisito_id)
  if (!empresaId) return;

  const requisitosDb = await sequelize.query(
    `SELECT id, codigo FROM requisitos_legales WHERE codigo IN (:codigos)`,
    { replacements: { codigos: REQUISITOS.map((r) => r.codigo) }, type: QueryTypes.SELECT }
  );
  const byCodigo = Object.fromEntries(requisitosDb.map((r) => [r.codigo, r.id]));

  for (const r of REQUISITOS) {
    const requisitoId = byCodigo[r.codigo];
    if (!requisitoId) continue;

    await sequelize.query(
      `INSERT INTO empresa_requisitos
        (id, empresa_id, requisito_id, fecha_asignacion, observaciones, created_at, updated_at)
       VALUES
        (gen_random_uuid(), :empresa_id, :requisito_id, CURRENT_DATE, :obs, NOW(), NOW())
       ON CONFLICT (empresa_id, requisito_id) DO NOTHING`,
      {
        replacements: {
          empresa_id: empresaId,
          requisito_id: requisitoId,
          obs: 'Asignación inicial - Empresa prueba Venezuela',
        },
        type: QueryTypes.INSERT,
      }
    );
  }
};

/* ------------------------------------------------------------------ */
/* DOWN                                                                */
/* ------------------------------------------------------------------ */

export const down = async (queryInterface) => {
  const { sequelize } = queryInterface;

  const empresaRows = await sequelize.query(
    `SELECT id FROM "Empresas" WHERE rif = :rif`,
    { replacements: { rif: EMPRESA.rif }, type: QueryTypes.SELECT }
  );
  const empresaIds = empresaRows.map((r) => r.id);

  // 1) Asignaciones y empleados de la empresa de prueba
  if (empresaIds.length > 0) {
    await sequelize.query(
      `DELETE FROM empresa_requisitos WHERE empresa_id IN (:ids)`,
      { replacements: { ids: empresaIds }, type: QueryTypes.DELETE }
    );
    await sequelize.query(
      `DELETE FROM "Empleados" WHERE empresa_id IN (:ids)`,
      { replacements: { ids: empresaIds }, type: QueryTypes.DELETE }
    );
  }

  // 2) Empresa
  await sequelize.query(
    `DELETE FROM "Empresas" WHERE rif = :rif`,
    { replacements: { rif: EMPRESA.rif }, type: QueryTypes.DELETE }
  );

  // 3) Usuario responsable (solo si no tiene otras dependencias)
  await sequelize.query(
    `DELETE FROM "Users" WHERE email = :email`,
    { replacements: { email: RESPONSABLE.email }, type: QueryTypes.DELETE }
  );

  // 4) Requisitos huérfanos (los que no estén asignados a ninguna empresa)
  await sequelize.query(
    `DELETE FROM requisitos_legales rl
      WHERE rl.codigo IN (:codigos)
        AND NOT EXISTS (
          SELECT 1 FROM empresa_requisitos er WHERE er.requisito_id = rl.id
        )`,
    { replacements: { codigos: REQUISITOS.map((r) => r.codigo) }, type: QueryTypes.DELETE }
  );

  // 5) Entes huérfanos (sin requisitos asociados)
  await sequelize.query(
    `DELETE FROM entes_reguladores er
      WHERE er.sigla IN (:siglas)
        AND NOT EXISTS (
          SELECT 1 FROM requisitos_legales rl WHERE rl.ente_id = er.id
        )`,
    { replacements: { siglas: ENTES.map((e) => e.sigla) }, type: QueryTypes.DELETE }
  );
};