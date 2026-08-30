import { EmpresaRequisito, Empresa, RequisitoLegal, Empleado } from '../models/index.js';

const validarResponsable = async (responsableId, empresaId) => {
  if (!responsableId) return true;
  const emp = await Empleado.findOne({ where: { id: responsableId, empresaId, activo: true } });
  return Boolean(emp);
};

const assign = async ({ empresaId, requisitoId, responsableId, observaciones }) => {
  const empresa = await Empresa.findByPk(empresaId);
  if (!empresa) throw Object.assign(new Error('Empresa no encontrada'), { status: 404 });

  const requisito = await RequisitoLegal.findByPk(requisitoId);
  if (!requisito) throw Object.assign(new Error('Requisito no encontrado'), { status: 404 });

  const responsableIdNormalizado = responsableId || null;

  if (responsableIdNormalizado && !(await validarResponsable(responsableIdNormalizado, empresaId))) {
    throw Object.assign(
      new Error('El responsable no es un empleado activo de esta empresa'),
      { status: 422 }
    );
  }

  const [asignacion, creada] = await EmpresaRequisito.findOrCreate({
    where: { empresaId, requisitoId },
    defaults: { responsableId: responsableIdNormalizado, observaciones },
  });

  if (!creada) {
    if (responsableId !== undefined) asignacion.responsableId = responsableIdNormalizado;
    if (observaciones !== undefined) asignacion.observaciones = observaciones;
    await asignacion.save();
  }

  return asignacion;
};

const bulkAssign = async ({ empresaId, requisitoIds = [], responsableId, observaciones }) => {
  const resultados = [];
  for (const requisitoId of requisitoIds) {
    resultados.push(await assign({ empresaId, requisitoId, responsableId, observaciones }));
  }
  return resultados;
};

export { assign, bulkAssign };