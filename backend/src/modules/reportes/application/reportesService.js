import db from '../../../models/index.js';
import { applyEmpresaScope, assertEmpresaInScope } from '../../../shared/security/tenant-scope.js';

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
const COLUMNAS_FACTURA = [
  'numero', 'empresa', 'fechaEmision', 'fechaPago', 'estado', 'total', 'deuda', 'tipoItems', 'cantidadItems',
];

const toNumber = (value) => Number(value || 0);

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

const serializarFacturaTabla = (factura, tipo = 'todos') => {
  const itemsFiltrados = filtroTipoItems(factura.items || [], tipo);
  if (!itemsFiltrados.length) return null;

  const tipos = new Set(itemsFiltrados.map((item) => (item.empresaServicio?.productoId ? 'producto' : 'servicio')));
  const deuda = factura.estado === 'pagada' ? 0 : toNumber(factura.total);

  return {
    id: factura.id,
    numero: factura.numero,
    empresa: factura.empresa?.nombre || '—',
    fechaEmision: factura.fechaEmision,
    fechaPago: factura.fechaPago,
    estado: factura.estado,
    total: toNumber(factura.total),
    deuda,
    tipoItems: tipos.size > 1 ? 'mixto' : [...tipos][0],
    cantidadItems: itemsFiltrados.length,
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

export const obtenerDashboardAvanzado = async (req) => {
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
  const filas = filasBase.slice(inicio, inicio + pageSize);

  const totalFacturado = filasBase.reduce((acc, row) => acc + row.total, 0);
  const deudaTotal = filasBase.reduce((acc, row) => acc + row.deuda, 0);
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
      totalFacturado,
      deudaTotal,
      ingresos,
      totalEmpleados: empleados.length,
      totalAuditoriasFinalizadas: auditorias.length,
      promedioCumplimiento,
    },
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

const valorCelda = (row, columna) => {
  if (columna === 'total' || columna === 'deuda') return toNumber(row[columna]).toFixed(2);
  return row[columna] ?? '';
};

const etiquetaColumna = {
  numero: 'Número', empresa: 'Empresa', fechaEmision: 'Fecha emisión', fechaPago: 'Fecha pago', estado: 'Estado', total: 'Total', deuda: 'Deuda', tipoItems: 'Tipo', cantidadItems: 'Ítems',
};

export const generarExcelDashboard = async (req) => {
  const data = await obtenerDashboardAvanzado(req);
  const columnas = normalizarColumnas(req.query.columns);

  const header = columnas.map((c) => `<Cell><Data ss:Type=\"String\">${escapeHtml(etiquetaColumna[c])}</Data></Cell>`).join('');
  const rows = data.tablaFacturas.items
    .map((row) => `<Row>${columnas.map((col) => `<Cell><Data ss:Type=\"String\">${escapeHtml(valorCelda(row, col))}</Data></Cell>`).join('')}</Row>`)
    .join('');

  const xml = `<?xml version=\"1.0\"?>\n<Workbook xmlns=\"urn:schemas-microsoft-com:office:spreadsheet\" xmlns:ss=\"urn:schemas-microsoft-com:office:spreadsheet\">\n  <Worksheet ss:Name=\"Dashboard\">\n    <Table>\n      <Row>${header}</Row>\n      ${rows}\n    </Table>\n  </Worksheet>\n</Workbook>`;

  return { contenido: Buffer.from(xml, 'utf8'), nombreArchivo: 'dashboard-avanzado.xls', contentType: 'application/vnd.ms-excel' };
};

export const generarPdfDashboard = async (req) => {
  const data = await obtenerDashboardAvanzado(req);
  const columnas = normalizarColumnas(req.query.columns);
  return { data, columnas };
};
