import db from '../models/index.js';
import { assertEmpresaInScope } from '../utils/empresaScope.js';
import {
  generarFacturaDesdeAsignaciones,
  cambiarEstadoFactura,
  emitirFactura,
  enviarFacturaEmitida,
  enviarFacturaPagada,
} from '../services/facturacionService.js';

const { Factura, FacturaItem, EmpresaServicio, Producto, Servicio, Empresa } = db;

export const getAll = async (req, res, next) => {
  try {
    const { empresaId, estado } = req.query;
    const where = {};
    if (estado) where.estado = estado;
    if (empresaId) {
      assertEmpresaInScope(empresaId, req);
      where.empresaId = empresaId;
    }

    const facturas = await Factura.findAll({
      where,
      attributes: { exclude: ['pdfContenido'] },
      include: [{ model: Empresa, as: 'empresa', attributes: ['id', 'nombre', 'rif'] }],
      order: [['createdAt', 'DESC']],
    });
    return res.json({ facturas: facturas.map((factura) => ({ ...factura.toJSON(), tienePdf: Boolean(factura.pdfNombreArchivo) })) });
  } catch (error) { return next(error); }
};

export const getById = async (req, res, next) => {
  try {
    const factura = await Factura.findByPk(req.params.id, {
      attributes: { exclude: ['pdfContenido'] },
      include: [
        { model: Empresa, as: 'empresa', attributes: ['id', 'nombre', 'rif', 'direccion', 'telefono', 'email'] },
        {
          model: FacturaItem,
          as: 'items',
          include: [
            {
              model: EmpresaServicio,
              as: 'empresaServicio',
              include: [
                { model: Producto, as: 'producto' },
                { model: Servicio, as: 'servicio' },
              ],
            },
          ],
        },
      ],
    });
    if (!factura) return res.status(404).json({ message: 'Factura no encontrada' });
    assertEmpresaInScope(factura.empresaId, req);
    return res.json({ factura: { ...factura.toJSON(), tienePdf: Boolean(factura.pdfNombreArchivo) } });
  } catch (error) { return next(error); }
};

export const create = async (req, res, next) => {
  try {
    const { empresaId, asignacionIds, fechaVencimiento, notas } = req.body;
    if (!empresaId || !Array.isArray(asignacionIds) || !asignacionIds.length) {
      return res.status(400).json({ message: 'empresaId y asignacionIds son obligatorios' });
    }
    assertEmpresaInScope(empresaId, req);

    const factura = await generarFacturaDesdeAsignaciones({
      empresaId,
      asignacionIds,
      fechaVencimiento,
      notas,
    });
    return res.status(201).json({ message: 'Factura generada', factura });
  } catch (error) { return next(error); }
};

export const update = async (req, res, next) => {
  try {
    const factura = await Factura.findByPk(req.params.id);
    if (!factura) return res.status(404).json({ message: 'Factura no encontrada' });
    assertEmpresaInScope(factura.empresaId, req);

    const camposPermitidos = ['fechaVencimiento', 'notas'];
    camposPermitidos.forEach((campo) => {
      if (req.body[campo] !== undefined) factura[campo] = req.body[campo];
    });
    await factura.save();
    return res.json({ message: 'Factura actualizada', factura });
  } catch (error) { return next(error); }
};

export const cambiarEstado = async (req, res, next) => {
  try {
    const { estado, fechaPago, metodoPago, referenciaPago, bancoPago, telefonoPago, montoPago } = req.body;
    const factura = await Factura.findByPk(req.params.id);
    if (!factura) return res.status(404).json({ message: 'Factura no encontrada' });
    assertEmpresaInScope(factura.empresaId, req);

    if (estado === 'emitida') {
      const facturaEmitida = await emitirFactura(factura.id);
      const resultadosCorreo = await enviarFacturaEmitida(facturaEmitida);
      const erroresCorreo = resultadosCorreo.filter((resultado) => !resultado.success).length;
      return res.json({
        message: erroresCorreo ? 'Factura emitida, pero no se pudo enviar a todos los destinatarios' : 'Factura emitida y enviada por correo',
        factura: { ...facturaEmitida.toJSON(), pdfContenido: undefined, tienePdf: true },
      });
    }

    if (estado === 'pagada') {
      if (factura.estado !== 'emitida') {
        return res.status(422).json({ message: 'Solo se pueden registrar pagos para facturas emitidas' });
      }
      const montoNormalizado = Number(montoPago);
      if (!fechaPago || !metodoPago || !Number.isFinite(montoNormalizado) || montoNormalizado <= 0) {
        return res.status(422).json({ message: 'fechaPago, metodoPago y montoPago son obligatorios' });
      }
      if (Math.abs(montoNormalizado - Number(factura.total)) > 0.01) {
        return res.status(422).json({ message: 'El monto pagado debe coincidir con el total de la factura' });
      }

      const facturaActualizada = await cambiarEstadoFactura(factura.id, estado);
      await facturaActualizada.update({
        fechaPago,
        metodoPago,
        referenciaPago: referenciaPago?.trim() || null,
        bancoPago: bancoPago?.trim() || null,
        telefonoPago: telefonoPago?.trim() || null,
        montoPago: montoNormalizado,
      });
      const resultadosCorreo = await enviarFacturaPagada(facturaActualizada);
      const erroresCorreo = resultadosCorreo.filter((resultado) => !resultado.success).length;
      return res.json({
        message: erroresCorreo ? 'Factura marcada como pagada, pero no se pudo enviar a todos los destinatarios' : 'Factura marcada como pagada y enviada por correo',
        factura: { ...facturaActualizada.toJSON(), pdfContenido: undefined, tienePdf: Boolean(facturaActualizada.pdfNombreArchivo) },
      });
    }

    const facturaActualizada = await cambiarEstadoFactura(factura.id, estado);
    return res.json({ message: 'Estado actualizado', factura: { ...facturaActualizada.toJSON(), pdfContenido: undefined, tienePdf: Boolean(facturaActualizada.pdfNombreArchivo) } });
  } catch (error) { return next(error); }
};

export const verPdf = async (req, res, next) => {
  try {
    const factura = await Factura.findByPk(req.params.id, { attributes: ['id', 'empresaId', 'pdfNombreArchivo', 'pdfContenido'] });
    if (!factura) return res.status(404).json({ message: 'Factura no encontrada' });
    assertEmpresaInScope(factura.empresaId, req);
    if (!factura.pdfContenido) return res.status(404).json({ message: 'La factura aún no tiene un PDF generado' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(factura.pdfNombreArchivo || `factura-${factura.id}.pdf`)}"`);
    return res.end(factura.pdfContenido);
  } catch (error) { return next(error); }
};

export const remove = async (req, res, next) => {
  try {
    const factura = await Factura.findByPk(req.params.id);
    if (!factura) return res.status(404).json({ message: 'Factura no encontrada' });
    assertEmpresaInScope(factura.empresaId, req);

    await cambiarEstadoFactura(factura.id, 'anulada');
    return res.json({ message: 'Factura anulada' });
  } catch (error) { return next(error); }
};
