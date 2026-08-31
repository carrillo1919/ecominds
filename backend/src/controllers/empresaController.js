import { Empresa, Auditoria, Empleado } from '../models/index.js';

// GET /api/empresas
const getAll = async (req, res, next) => {
  try {
    const empresas = await Empresa.findAll({
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
        {
          model: Empleado,
          as: 'responsableEmpleado',
          attributes: ['id', 'nombre', 'apellido', 'cargo'],
        },
      ],
    });

    return res.json({
      empresas: empresas.map((e) => {
        const plain = e.toJSON();
        return { ...plain, ultimaAuditoria: plain.auditorias?.[0] || null, auditorias: undefined };
      }),
    });
  } catch (error) {
    return next(error);
  }
};

// GET /api/empresas/:id
const getOne = async (req, res, next) => {
  try {
    const empresa = await Empresa.findByPk(req.params.id, {
      include: [
        {
          model: Empleado,
          as: 'responsableEmpleado',
          attributes: ['id', 'nombre', 'apellido', 'cargo'],
        },
      ],
    });
    if (!empresa) return res.status(404).json({ message: 'Empresa no encontrada' });
    return res.json({ empresa });
  } catch (error) {
    return next(error);
  }
};

// POST /api/empresas
const create = async (req, res, next) => {
  try {
    const { nombre, rif, sector, actividad, direccion, telefono, email, responsableId } = req.body;

    const existente = await Empresa.findOne({ where: { rif: String(rif).trim().toUpperCase() } });
    if (existente) return res.status(409).json({ message: 'Ya existe una empresa con ese RIF' });

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

    const result = await Empresa.findByPk(empresa.id, {
      include: [
        {
          model: Empleado,
          as: 'responsableEmpleado',
          attributes: ['id', 'nombre', 'apellido', 'cargo'],
        },
      ],
    });

    return res.status(201).json({ message: 'Empresa registrada', empresa: result });
  } catch (error) {
    return next(error);
  }
};

// PUT /api/empresas/:id
const update = async (req, res, next) => {
  try {
    const empresa = await Empresa.findByPk(req.params.id);
    if (!empresa) return res.status(404).json({ message: 'Empresa no encontrada' });

    const campos = ['nombre', 'rif', 'sector', 'actividad', 'direccion', 'telefono', 'email', 'activo'];
    campos.forEach((campo) => {
      if (req.body[campo] !== undefined) empresa[campo] = req.body[campo];
    });
    if (req.body.responsableId !== undefined) empresa.responsableId = req.body.responsableId || null;

    await empresa.save();

    const result = await Empresa.findByPk(empresa.id, {
      include: [
        {
          model: Empleado,
          as: 'responsableEmpleado',
          attributes: ['id', 'nombre', 'apellido', 'cargo'],
        },
      ],
    });

    return res.json({ message: 'Empresa actualizada', empresa: result });
  } catch (error) {
    return next(error);
  }
};

export { getAll, getOne, create, update };
