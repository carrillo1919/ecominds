import {
  listarFacturas,
  obtenerFactura,
  generarFacturaDesdeAsignaciones,
  actualizarFactura,
  cambiarEstadoConReglas,
  anularFactura,
  obtenerPdfFactura,
} from '../../application/facturacionService.js';

export const getAll = async (req, res, next) => {
  try {
    const facturas = await listarFacturas(req);
    return res.json({ facturas });
  } catch (error) { return next(error); }
};

export const getById = async (req, res, next) => {
  try {
    const factura = await obtenerFactura(req.params.id, req);
    return res.json({ factura });
  } catch (error) { return next(error); }
};

export const create = async (req, res, next) => {
  try {
    const { empresaId, asignacionIds, fechaVencimiento, notas } = req.body;
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
    const factura = await actualizarFactura(req.params.id, req);
    return res.json({ message: 'Factura actualizada', factura });
  } catch (error) { return next(error); }
};

export const cambiarEstado = async (req, res, next) => {
  try {
    const { message, factura } = await cambiarEstadoConReglas(req.params.id, req);
    return res.json({ message, factura });
  } catch (error) { return next(error); }
};

export const verPdf = async (req, res, next) => {
  try {
    const { contenido, nombreArchivo } = await obtenerPdfFactura(req.params.id, req);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(nombreArchivo)}"`);
    return res.end(contenido);
  } catch (error) { return next(error); }
};

export const remove = async (req, res, next) => {
  try {
    await anularFactura(req.params.id, req);
    return res.json({ message: 'Factura anulada' });
  } catch (error) { return next(error); }
};
