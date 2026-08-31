import { EmpresaRequisito, Empresa, RequisitoLegal } from '../models/index.js';

const assign = async ({ empresaId, requisitoId, observaciones }) => {
  const empresa = await Empresa.findByPk(empresaId);
  if (!empresa) throw Object.assign(new Error('Empresa no encontrada'), { status: 404 });

  const requisito = await RequisitoLegal.findByPk(requisitoId);
  if (!requisito) throw Object.assign(new Error('Requisito no encontrado'), { status: 404 });

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

export { assign, bulkAssign };