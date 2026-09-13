import {
  obtenerDashboardAvanzado,
  generarExcelDashboard,
  generarPdfDashboard,
} from '../../application/reportesService.js';
import { construirPdfDashboard } from '../../infrastructure/pdf/dashboard-report.js';

export const dashboard = async (req, res, next) => {
  try {
    const data = await obtenerDashboardAvanzado(req);
    return res.json(data);
  } catch (error) {
    return next(error);
  }
};

export const exportarExcel = async (req, res, next) => {
  try {
    const { contenido, nombreArchivo, contentType } = await generarExcelDashboard(req);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=\"${nombreArchivo}\"`);
    return res.end(contenido);
  } catch (error) {
    return next(error);
  }
};

export const exportarPdf = async (req, res, next) => {
  try {
    const payload = await generarPdfDashboard(req);
    const doc = construirPdfDashboard(payload);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="dashboard-avanzado.pdf"');
    doc.pipe(res);
    doc.end();
    return undefined;
  } catch (error) {
    return next(error);
  }
};
