import { QueryTypes } from 'sequelize';
import { addDays, format } from 'date-fns';

export const up = async (queryInterface) => {
  const asignacionesCount = await queryInterface.sequelize.query('SELECT COUNT(*) FROM "EmpresaServicios"', { type: QueryTypes.SELECT });
  if (Number(asignacionesCount[0].count) > 0) return;

  const empresas = await queryInterface.sequelize.query('SELECT id FROM "Empresas" LIMIT 2', { type: QueryTypes.SELECT });
  if (empresas.length === 0) return;

  const productos = await queryInterface.sequelize.query('SELECT id, precio, "unidadMedida" FROM "Productos" LIMIT 2', { type: QueryTypes.SELECT });
  const servicios = await queryInterface.sequelize.query('SELECT id, precio, "unidadMedida" FROM "Servicios" LIMIT 2', { type: QueryTypes.SELECT });

  const hoy = new Date();
  const fechaCercana = format(addDays(hoy, 3), 'yyyy-MM-dd');
  const fechaProxima = format(addDays(hoy, 7), 'yyyy-MM-dd');

  const calcularTotal = (cantidad, precio) => Number((cantidad * Number(precio)).toFixed(2));

  const asignaciones = [];

  if (productos[0]) {
    asignaciones.push({
      id: queryInterface.sequelize.literal('gen_random_uuid()'),
      empresaId: empresas[0].id,
      productoId: productos[0].id,
      servicioId: null,
      cantidad: 2,
      precioUnitario: productos[0].precio,
      unidadMedida: productos[0].unidadMedida,
      precioTotal: calcularTotal(2, productos[0].precio),
      fechaEjecucion: null,
      fechaEntrega: fechaCercana,
      estado: 'pendiente',
      observaciones: 'Entrega programada para la próxima semana',
      facturaId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  if (productos[1] && empresas[1]) {
    asignaciones.push({
      id: queryInterface.sequelize.literal('gen_random_uuid()'),
      empresaId: empresas[1].id,
      productoId: productos[1].id,
      servicioId: null,
      cantidad: 1,
      precioUnitario: productos[1].precio,
      unidadMedida: productos[1].unidadMedida,
      precioTotal: calcularTotal(1, productos[1].precio),
      fechaEjecucion: null,
      fechaEntrega: fechaProxima,
      estado: 'pendiente',
      observaciones: 'Entrega de manuales adicionales',
      facturaId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  if (servicios[0]) {
    asignaciones.push({
      id: queryInterface.sequelize.literal('gen_random_uuid()'),
      empresaId: empresas[0].id,
      productoId: null,
      servicioId: servicios[0].id,
      cantidad: 1,
      precioUnitario: servicios[0].precio,
      unidadMedida: servicios[0].unidadMedida,
      precioTotal: calcularTotal(1, servicios[0].precio),
      fechaEjecucion: fechaCercana,
      fechaEntrega: null,
      estado: 'pendiente',
      observaciones: 'Auditoría de cumplimiento programada',
      facturaId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  if (servicios[1] && empresas[1]) {
    asignaciones.push({
      id: queryInterface.sequelize.literal('gen_random_uuid()'),
      empresaId: empresas[1].id,
      productoId: null,
      servicioId: servicios[1].id,
      cantidad: 1,
      precioUnitario: servicios[1].precio,
      unidadMedida: servicios[1].unidadMedida,
      precioTotal: calcularTotal(1, servicios[1].precio),
      fechaEjecucion: fechaProxima,
      fechaEntrega: null,
      estado: 'pendiente',
      observaciones: 'Capacitación en normativa para el equipo',
      facturaId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  if (asignaciones.length) {
    await queryInterface.bulkInsert('EmpresaServicios', asignaciones, {});
  }
};

export const down = async (queryInterface) => {
  await queryInterface.bulkDelete('EmpresaServicios', { observaciones: ['Entrega programada para la próxima semana', 'Entrega de manuales adicionales', 'Auditoría de cumplimiento programada', 'Capacitación en normativa para el equipo'] }, {});
};
