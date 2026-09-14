import db from '../../../models/index.js';
import { applyEmpresaScope, assertEmpresaInScope, scopeRequiereEmpresaId } from '../../../shared/security/tenant-scope.js';

const {
  Sequelize,
  Factura,
  FacturaItem,
  Empresa,
  EmpresaServicio,
  Empleado,
  Auditoria,
} = db;

const { Op } = Sequelize;

const ESTADOS_FACTURA = ['borrador', 'emitida', 'pagada', 'anulada'];
const TIPOS_ITEM = ['producto', 'servicio'];
const COLUMNAS_FACTURA = [
  'numero', 'empresa', 'fechaEmision', 'fechaPago', 'estado', 'tipoItems', 'descripcionItems',
  'cantidadItems', 'cantidadTotal', 'subtotal', 'descuento', 'impuesto', 'total', 'deuda',
];

const toNumber = (value) => Number(value || 0);
const redondear = (value) => Math.round(toNumber(value) * 100) / 100;

const normalizarEstados = (estadosRaw) => {
  if (!estadosRaw) return ESTADOS_FACTURA;
  const estados = String(estadosRaw).split(',').map((s) => s.trim()).filter((s) => ESTADOS_FACTURA.includes(s));
  return estados.length ? estados : ESTADOS_FACTURA;
};

const normalizarColumnas = (columnasRaw) => {
  if (!columnasRaw) return COLUMNAS_FACTURA;
  const columnas = String(columnasRaw).split(',').map((s) => s.trim()).filter((s) => COLUMNAS_FACTURA.includes(s));
  return columnas.length ? columnas : COLUMNAS_FACTURA;
};

const rangoFechas = (desde, hasta) => {
  if (!desde && !hasta) return null;
  const where = {};
  if (desde) where[Op.gte] = desde;
  if (hasta) where[Op.lte] = hasta;
  return where;
};

const buildWhereFacturas = (req) => {
  const { empresaId, desde, hasta } = req.query;
  const estados = normalizarEstados(req.query.estados);
  const where = applyEmpresaScope({ estado: { [Op.in]: estados } }, req);

  if (empresaId) {
    assertEmpresaInScope(empresaId, req);
    where.empresaId = empresaId;
  }

  const fechaRange = rangoFechas(desde, hasta);
  if (fechaRange) where.fechaEmision = fechaRange;
  return where;
};

const buildWhereIngresos = (req, overrideRange = null) => {
  const { empresaId, desde, hasta } = req.query;
  const where = applyEmpresaScope({ estado: 'pagada' }, req);
  if (empresaId) {
    assertEmpresaInScope(empresaId, req);
    where.empresaId = empresaId;
  }
  const range = overrideRange || rangoFechas(desde, hasta);
  if (range) where.fechaPago = range;
  return where;
};

const filtroTipoItems = (items, tipo) => {
  if (!tipo || tipo === 'todos') return items;
  return items.filter((item) => {
    const esProducto = Boolean(item.empresaServicio?.productoId);
    return tipo === 'producto' ? esProducto : !esProducto;
  });
};

// Un item es producto si su empresaServicio apunta a un producto; en caso contrario es servicio.
const tipoDeItem = (item) => (item.empresaServicio?.productoId ? 'producto' : 'servicio');

// En FacturaItem `impuesto` es la tasa (ej. 16 = 16%), por eso el monto se deriva del total
// y de la base ya descontada.
const montoImpuestoItem = (item) => redondear(
  toNumber(item.total) - toNumber(item.subtotal) + toNumber(item.descuento)
);

const serializarItemDetalle = (factura, item) => ({
  id: item.id,
  facturaId: factura.id,
  numero: factura.numero,
  empresa: factura.empresa?.nombre || '—',
  fechaEmision: factura.fechaEmision,
  estado: factura.estado,
  tipo: tipoDeItem(item),
  descripcion: item.descripcion,
  cantidad: toNumber(item.cantidad),
  unidadMedida: item.unidadMedida || '',
  precioUnitario: toNumber(item.precioUnitario),
  tasaImpuesto: toNumber(item.impuesto),
  impuesto: montoImpuestoItem(item),
  subtotal: toNumber(item.subtotal),
  descuento: toNumber(item.descuento),
  total: toNumber(item.total),
});

const resumenVacio = () => ({ items: 0, cantidad: 0, subtotal: 0, descuento: 0, impuesto: 0, total: 0 });

const acumularResumen = (acc, item) => {
  acc.items += 1;
  acc.cantidad += item.cantidad;
  acc.subtotal += item.subtotal;
  acc.descuento += item.descuento;
  acc.impuesto += item.impuesto;
  acc.total += item.total;
};

const construirResumenItems = (detalle) => {
  const resumen = { todos: resumenVacio(), ...Object.fromEntries(TIPOS_ITEM.map((t) => [t, resumenVacio()])) };

  detalle.forEach((item) => {
    acumularResumen(resumen.todos, item);
    if (resumen[item.tipo]) acumularResumen(resumen[item.tipo], item);
  });

  Object.values(resumen).forEach((grupo) => {
    grupo.cantidad = redondear(grupo.cantidad);
    grupo.subtotal = redondear(grupo.subtotal);
    grupo.descuento = redondear(grupo.descuento);
    grupo.impuesto = redondear(grupo.impuesto);
    grupo.total = redondear(grupo.total);
  });

  return resumen;
};

const serializarFacturaTabla = (factura, tipo = 'todos') => {
  const itemsFiltrados = filtroTipoItems(factura.items || [], tipo);
  if (!itemsFiltrados.length) return null;

  const tipos = new Set(itemsFiltrados.map(tipoDeItem));
  const deuda = factura.estado === 'pagada' ? 0 : toNumber(factura.total);
  const descripcionItems = itemsFiltrados.map((item) => item.descripcion).filter(Boolean).join(' | ');
  const cantidadTotal = redondear(itemsFiltrados.reduce((acc, item) => acc + toNumber(item.cantidad), 0));

  return {
    id: factura.id,
    numero: factura.numero,
    empresa: factura.empresa?.nombre || '—',
    fechaEmision: factura.fechaEmision,
    fechaPago: factura.fechaPago,
    estado: factura.estado,
    subtotal: toNumber(factura.subtotal),
    descuento: toNumber(factura.descuento),
    impuesto: toNumber(factura.impuesto),
    total: toNumber(factura.total),
    deuda,
    tipoItems: tipos.size > 1 ? 'mixto' : [...tipos][0],
    descripcionItems,
    cantidadItems: itemsFiltrados.length,
    cantidadTotal,
    itemsDetalle: itemsFiltrados.map((item) => serializarItemDetalle(factura, item)),
  };
};

const buildComparativo = ({ desde, hasta }, totalFacturado, ingresos) => {
  if (!desde || !hasta) {
    return {
      tieneComparativo: false,
      periodoActual: { desde: desde || null, hasta: hasta || null, totalFacturado, ingresos },
      periodoAnterior: null,
      variacion: null,
    };
  }

  const inicio = new Date(`${desde}T00:00:00.000Z`);
  const fin = new Date(`${hasta}T00:00:00.000Z`);
  const dias = Math.max(1, Math.round((fin.getTime() - inicio.getTime()) / (24 * 60 * 60 * 1000)) + 1);
  const anteriorHasta = new Date(inicio.getTime() - 86400000);
  const anteriorDesde = new Date(anteriorHasta.getTime() - (dias - 1) * 86400000);
  const fechaIso = (d) => d.toISOString().slice(0, 10);

  return {
    tieneComparativo: true,
    periodoActual: { desde, hasta, totalFacturado, ingresos },
    periodoAnterior: { desde: fechaIso(anteriorDesde), hasta: fechaIso(anteriorHasta) },
    variacion: null,
  };
};

export const obtenerDashboardAvanzado = async (req, options = {}) => {
  const { paginar = true } = options;
  const whereFacturas = buildWhereFacturas(req);
  const { tipo = 'todos', search = '', page = 1, limit = 20, sortBy = 'fechaEmision', sortDir = 'desc' } = req.query;

  const facturas = await Factura.findAll({
    where: whereFacturas,
    include: [
      { model: Empresa, as: 'empresa', attributes: ['id', 'nombre'] },
      {
        model: FacturaItem,
        as: 'items',
        include: [{ model: EmpresaServicio, as: 'empresaServicio', attributes: ['id', 'productoId', 'servicioId'] }],
      },
    ],
    order: [['fechaEmision', 'DESC']],
  });

  const filasBase = facturas
    .map((factura) => serializarFacturaTabla(factura, tipo))
    .filter(Boolean)
    .filter((row) => {
      if (!search) return true;
      const q = String(search).toLowerCase();
      return row.numero.toLowerCase().includes(q) || row.empresa.toLowerCase().includes(q) || row.estado.toLowerCase().includes(q);
    });

  const sortField = COLUMNAS_FACTURA.includes(sortBy) ? sortBy : 'fechaEmision';
  const dir = String(sortDir).toLowerCase() === 'asc' ? 1 : -1;
  filasBase.sort((a, b) => {
    const av = a[sortField];
    const bv = b[sortField];
    if (av === bv) return 0;
    if (av === null || av === undefined) return 1;
    if (bv === null || bv === undefined) return -1;
    return av > bv ? dir : -dir;
  });

  const pageNum = Math.max(1, Number(page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(limit) || 20));
  const inicio = (pageNum - 1) * pageSize;
  const filas = paginar ? filasBase.slice(inicio, inicio + pageSize) : filasBase;

  const totalFacturado = filasBase.reduce((acc, row) => acc + row.total, 0);
  const totalDescuentos = filasBase.reduce((acc, row) => acc + row.descuento, 0);
  // La base sin impuestos es el subtotal ya descontado, de forma que
  // totalFacturadoSinImpuesto + totalImpuestos === totalFacturado.
  const totalFacturadoSinImpuesto = filasBase.reduce((acc, row) => acc + row.subtotal - row.descuento, 0);
  const deudaTotal = filasBase.reduce((acc, row) => acc + row.deuda, 0);

  const detalleItems = filasBase.flatMap((row) => row.itemsDetalle);
  const resumenItems = construirResumenItems(detalleItems);
  const facturasPagadasRangoPago = await Factura.findAll({
    where: buildWhereIngresos(req),
    attributes: ['total'],
  });
  const ingresos = facturasPagadasRangoPago.reduce((acc, row) => acc + toNumber(row.total), 0);

  const distribucionFacturas = ESTADOS_FACTURA.reduce((acc, estado) => {
    acc[estado] = { cantidad: 0, monto: 0 };
    return acc;
  }, {});

  filasBase.forEach((row) => {
    distribucionFacturas[row.estado].cantidad += 1;
    distribucionFacturas[row.estado].monto += row.total;
  });

  const whereEmpleados = applyEmpresaScope({}, req);
  if (req.query.empresaId) whereEmpleados.empresaId = req.query.empresaId;
  const empleados = await Empleado.findAll({
    where: whereEmpleados,
    attributes: ['id', 'empresaId', 'nombre', 'apellido', 'cargo', 'email', 'activo'],
    include: [{ model: Empresa, as: 'empresa', attributes: ['id', 'nombre'] }],
    order: [['apellido', 'ASC'], ['nombre', 'ASC']],
  });

  const auditoriaWhere = applyEmpresaScope({ estado: 'finalizada' }, req);
  if (req.query.empresaId) auditoriaWhere.empresaId = req.query.empresaId;
  const rango = rangoFechas(req.query.desde, req.query.hasta);
  if (rango) auditoriaWhere.fecha = rango;
  const auditorias = await Auditoria.findAll({ where: auditoriaWhere, attributes: ['id', 'nivelRiesgo', 'porcentajeCumplimiento'] });

  const distribucionRiesgo = { BAJO: 0, MEDIO: 0, ALTO: 0 };
  auditorias.forEach((a) => { distribucionRiesgo[a.nivelRiesgo] += 1; });

  const promedioCumplimiento = auditorias.length
    ? Math.round((auditorias.reduce((acc, a) => acc + toNumber(a.porcentajeCumplimiento), 0) / auditorias.length) * 100) / 100
    : 0;

  const comparativo = buildComparativo({ desde: req.query.desde, hasta: req.query.hasta }, totalFacturado, ingresos);

  if (comparativo.tieneComparativo) {
    const wherePrev = buildWhereFacturas({ ...req, query: { ...req.query, desde: comparativo.periodoAnterior.desde, hasta: comparativo.periodoAnterior.hasta } });
    const factPrev = await Factura.findAll({ where: wherePrev, attributes: ['total', 'estado', 'fechaPago'] });
    const totalPrev = factPrev.reduce((acc, f) => acc + toNumber(f.total), 0);
    const ingPrevRows = await Factura.findAll({
      where: buildWhereIngresos(
        { ...req, query: { ...req.query, empresaId: req.query.empresaId || null } },
        rangoFechas(comparativo.periodoAnterior.desde, comparativo.periodoAnterior.hasta)
      ),
      attributes: ['total'],
    });
    const ingPrev = ingPrevRows.reduce((acc, f) => acc + toNumber(f.total), 0);

    comparativo.periodoAnterior.totalFacturado = totalPrev;
    comparativo.periodoAnterior.ingresos = ingPrev;
    comparativo.variacion = {
      facturadoPct: totalPrev ? Math.round(((totalFacturado - totalPrev) / totalPrev) * 10000) / 100 : null,
      ingresosPct: ingPrev ? Math.round(((ingresos - ingPrev) / ingPrev) * 10000) / 100 : null,
    };
  }

  return {
    filtrosAplicados: {
      empresaId: req.query.empresaId || null,
      empresaIdRequerido: scopeRequiereEmpresaId(req),
      desde: req.query.desde || null,
      hasta: req.query.hasta || null,
      estados: normalizarEstados(req.query.estados),
      tipo,
      search: search || null,
      page: pageNum,
      limit: pageSize,
      sortBy: sortField,
      sortDir: dir === 1 ? 'asc' : 'desc',
    },
    kpis: {
      totalFacturas: filasBase.length,
      totalFacturado: redondear(totalFacturado),
      totalFacturadoSinImpuesto: redondear(totalFacturadoSinImpuesto),
      totalDescuentos: redondear(totalDescuentos),
      totalImpuestos: redondear(totalFacturado - totalFacturadoSinImpuesto),
      deudaTotal: redondear(deudaTotal),
      ingresos: redondear(ingresos),
      totalEmpleados: empleados.length,
      totalAuditoriasFinalizadas: auditorias.length,
      promedioCumplimiento,
    },
    resumenItems,
    detalleItems,
    distribucionFacturas,
    distribucionRiesgo,
    comparativo,
    empleados: empleados.map((e) => ({
      id: e.id,
      empresa: e.empresa?.nombre || '—',
      nombreCompleto: `${e.nombre} ${e.apellido}`,
      cargo: e.cargo,
      email: e.email,
      activo: e.activo,
    })),
    tablaFacturas: { total: filasBase.length, page: pageNum, limit: pageSize, items: filas },
    columnasDisponibles: COLUMNAS_FACTURA,
  };
};

const escapeHtml = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

const COLUMNAS_NUMERICAS = ['subtotal', 'descuento', 'impuesto', 'total', 'deuda'];

const valorCelda = (row, columna) => {
  if (COLUMNAS_NUMERICAS.includes(columna)) return toNumber(row[columna]).toFixed(2);
  return row[columna] ?? '';
};

const etiquetaColumna = {
  numero: 'Número', empresa: 'Empresa', fechaEmision: 'Fecha emisión', fechaPago: 'Fecha pago', estado: 'Estado',
  subtotal: 'Subtotal', descuento: 'Descuento', impuesto: 'Impuesto', total: 'Total', deuda: 'Deuda', tipoItems: 'Tipo',
  descripcionItems: 'Descripción ítems', cantidadItems: 'Líneas', cantidadTotal: 'Cantidad',
};

const ETIQUETAS_ITEM = {
  numero: 'Factura', empresa: 'Empresa', fechaEmision: 'F. emisión', estado: 'Estado', tipo: 'Tipo', descripcion: 'Descripción', cantidad: 'Cantidad', unidadMedida: 'Unidad', precioUnitario: 'Precio unitario', subtotal: 'Subtotal', descuento: 'Descuento', impuesto: 'Impuesto', total: 'Total',
};

const COLUMNAS_ITEM = Object.keys(ETIQUETAS_ITEM);

const celdaExcel = (valor, tipo = 'String') => `<Cell><Data ss:Type="${tipo}">${escapeHtml(valor)}</Data></Cell>`;

const hojaExcel = (nombre, columnas, etiquetas, filas) => {
  const header = columnas.map((c) => celdaExcel(etiquetas[c] || c)).join('');
  const rows = filas.map((fila) => `<Row>${columnas.map((col) => celdaExcel(fila[col] ?? '')).join('')}</Row>`).join('');
  return `<Worksheet ss:Name="${nombre}"><Table><Row>${header}</Row>${rows}</Table></Worksheet>`;
};

const filaResumenExcel = (etiqueta, grupo) => {
  const valores = [etiqueta, grupo.items, grupo.cantidad, grupo.subtotal, grupo.descuento, grupo.impuesto, grupo.total];
  return `<Row>${valores.map((valor) => celdaExcel(valor)).join('')}</Row>`;
};

export const generarExcelDashboard = async (req) => {
  const data = await obtenerDashboardAvanzado(req, { paginar: false });
  const columnas = normalizarColumnas(req.query.columns);

  const hojaFacturas = hojaExcel('Facturas', columnas, etiquetaColumna, data.tablaFacturas.items.map((row) => (
    Object.fromEntries(columnas.map((col) => [col, valorCelda(row, col)]))
  )));

  const hojaResumen = `<Worksheet ss:Name="Resumen"><Table>
      <Row>${['Grupo', 'Líneas', 'Cantidad', 'Subtotal', 'Descuento', 'Impuesto', 'Total'].map((t) => celdaExcel(t)).join('')}</Row>
      ${filaResumenExcel('Total', data.resumenItems.todos)}
      ${filaResumenExcel('Productos', data.resumenItems.producto)}
      ${filaResumenExcel('Servicios', data.resumenItems.servicio)}
    </Table></Worksheet>`;

  const hojaItems = hojaExcel('Items', COLUMNAS_ITEM, ETIQUETAS_ITEM, data.detalleItems);

  const xml = `<?xml version="1.0"?>\n<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n${hojaResumen}\n${hojaFacturas}\n${hojaItems}\n</Workbook>`;

  return { contenido: Buffer.from(xml, 'utf8'), nombreArchivo: 'dashboard-avanzado.xls', contentType: 'application/vnd.ms-excel' };
};

export const generarPdfDashboard = async (req) => {
  const data = await obtenerDashboardAvanzado(req, { paginar: false });
  const columnas = normalizarColumnas(req.query.columns);
  return { data, columnas };
};
