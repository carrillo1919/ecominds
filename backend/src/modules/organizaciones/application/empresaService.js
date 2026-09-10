import { Empresa, Auditoria, Empleado } from '../../../models/index.js';
import { applyEmpresaScope, assertEmpresaInScope } from '../../../shared/security/tenant-scope.js';
import HttpError from '../../../shared/http/errors/http-error.js';

const INCLUDE_RESPONSABLE = {
  model: Empleado,
  as: 'responsableEmpleado',
  attributes: ['id', 'nombre', 'apellido', 'cargo'],
};

export const listarEmpresas = async (req) => {
  const empresas = await Empresa.findAll({
    where: applyEmpresaScope({}, req, 'id'),
    order: [['nombre', 'ASC']],
    include: [
      {
        model: Auditoria,
        as: 'auditorias',
        attributes: ['id', 'fecha', 'fechaProximaAuditoria', 'nivelRiesgo', 'porcentajeCumplimiento', 'estado'],
        separate: true,
        order: [['fecha', 'DESC']],
        limit: 1,
      },
      INCLUDE_RESPONSABLE,
    ],
  });

  return empresas.map((e) => {
    const plain = e.toJSON();
    return { ...plain, ultimaAuditoria: plain.auditorias?.[0] || null, auditorias: undefined };
  });
};

export const obtenerEmpresa = async (id, req) => {
  const empresa = await Empresa.findByPk(id, { include: [INCLUDE_RESPONSABLE] });
  if (!empresa) {
    throw new HttpError(404, 'Empresa no encontrada');
  }
  assertEmpresaInScope(empresa.id, req);
  return empresa;
};

export const crearEmpresa = async (req) => {
  const { nombre, rif, sector, actividad, direccion, telefono, email, responsableId } = req.body;

  const existente = await Empresa.findOne({ where: { rif: String(rif).trim().toUpperCase() } });
  if (existente) {
    throw new HttpError(409, 'Ya existe una empresa con ese RIF');
  }

  const empresa = await Empresa.create({
    nombre,
    rif,
    sector,
    actividad,
    direccion,
    telefono,
    email: email || null,
    responsableId: responsableId || null,
  });

  return Empresa.findByPk(empresa.id, { include: [INCLUDE_RESPONSABLE] });
};

export const actualizarEmpresa = async (id, req) => {
  const empresa = await Empresa.findByPk(id);
  if (!empresa) {
    throw new HttpError(404, 'Empresa no encontrada');
  }
  assertEmpresaInScope(empresa.id, req);

  const campos = ['nombre', 'rif', 'sector', 'actividad', 'direccion', 'telefono', 'email', 'activo'];
  campos.forEach((campo) => {
    if (req.body[campo] !== undefined) empresa[campo] = req.body[campo];
  });
  if (req.body.responsableId !== undefined) empresa.responsableId = req.body.responsableId || null;

  await empresa.save();

  return Empresa.findByPk(empresa.id, { include: [INCLUDE_RESPONSABLE] });
};

// Baja lógica: la empresa se desactiva y se libera su RIF para poder reutilizarlo.
export const darDeBajaEmpresa = async (id, req) => {
  const empresa = await Empresa.findByPk(id);
  if (!empresa) {
    throw new HttpError(404, 'Empresa no encontrada');
  }
  assertEmpresaInScope(empresa.id, req);

  if (empresa.esDemo) {
    throw new HttpError(403, 'No se puede dar de baja la empresa demo');
  }

  if (!empresa.activo) {
    throw new HttpError(409, 'La empresa ya está dada de baja');
  }

  empresa.activo = false;
  // El RIF es UNIQUE: se libera para permitir registrar de nuevo la misma empresa.
  empresa.rif = `${empresa.rif}__baja_${Date.now()}`;
  await empresa.save();

  return empresa;
};