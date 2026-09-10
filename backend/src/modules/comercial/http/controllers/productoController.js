import {
  listarProductos,
  obtenerProducto,
  crearProducto,
  actualizarProducto,
  desactivarProducto,
} from '../../application/productoService.js';

export const getAll = async (req, res, next) => {
  try {
    const productos = await listarProductos(req);
    return res.json({ productos });
  } catch (error) { return next(error); }
};

export const getById = async (req, res, next) => {
  try {
    const producto = await obtenerProducto(req.params.id);
    return res.json({ producto });
  } catch (error) { return next(error); }
};

export const create = async (req, res, next) => {
  try {
    const producto = await crearProducto(req);
    return res.status(201).json({ message: 'Producto creado', producto });
  } catch (error) { return next(error); }
};

export const update = async (req, res, next) => {
  try {
    const producto = await actualizarProducto(req.params.id, req);
    return res.json({ message: 'Producto actualizado', producto });
  } catch (error) { return next(error); }
};

export const remove = async (req, res, next) => {
  try {
    await desactivarProducto(req.params.id);
    return res.json({ message: 'Producto desactivado' });
  } catch (error) { return next(error); }
};
