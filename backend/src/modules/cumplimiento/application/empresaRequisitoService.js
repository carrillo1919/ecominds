import { EmpresaRequisito, Empresa, RequisitoLegal, EnteRegulador } from '../../../models/index.js';
import { assertEmpresaInScope } from '../../../shared/security/tenant-scope.js';
import HttpError from '../../../shared/http/errors/http-error.js';

const INCLUDE_REQUISITO = {
  model: RequisitoLegal,
  as: 'requisito',
  include: [{ model: EnteRegulador, as: 'ente', attributes: ['id', 'nombre', 'sigla'] }],
};

const assign = async ({ empresaId, requisitoId, observaciones }) => {
  const empresa = await Empresa.findByPk(empresaId);
  if (!empresa) throw new HttpError(404, 'Empresa no encontrada');

  const requisito = await RequisitoLegal.findByPk(requisitoId);
  if (!requisito) throw new HttpError(404, 'Requisito no encontrado');

  const [asignacion, creada] = await EmpresaRequisito.findOrCreate({
    where: { empresaId, requisitoId },
    defaults: { observaciones },
  });

  if (!creada && observaciones !== undefined) {
    asignacion.observaciones = observaciones;
    await asignacion.save();
  }

  return asignacion;
};

const bulkAssign = async ({ empresaId, requisitoIds = [], observaciones }) => {
  const resultados = [];
  for (const requisitoId of requisitoIds) {
    resultados.push(await assign({ empresaId, requisitoId, observaciones }));
  }
  return resultados;
};

const listarPorEmpresa = async (empresaId, req) => {
  assertEmpresaInScope(empresaId, req);
  return EmpresaRequisito.findAll({
    where: { empresaId },
    include: [INCLUDE_REQUISITO],
    order: [['created_at', 'DESC']],
  });
};

const actualizarAsignacion = async (id, req) => {
  const asignacion = await EmpresaRequisito.findByPk(id);
  if (!asignacion) throw new HttpError(404, 'Asignación no encontrada');
  assertEmpresaInScope(asignacion.empresaId, req);

  if (req.body.observaciones !== undefined) asignacion.observaciones = req.body.observaciones;
  await asignacion.save();

  return EmpresaRequisito.findByPk(asignacion.id, { include: [INCLUDE_REQUISITO] });
};

const eliminarAsignacion = async (id, req) => {
  const asignacion = await EmpresaRequisito.findByPk(id);
  if (!asignacion) throw new HttpError(404, 'Asignación no encontrada');
  assertEmpresaInScope(asignacion.empresaId, req);
  await asignacion.destroy();
};

export { assign, bulkAssign, listarPorEmpresa, actualizarAsignacion, eliminarAsignacion };