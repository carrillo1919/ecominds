export const UNIDADES_MEDIDA = [
  'unidad',
  'lts',
  'mts',
  'kg',
  'g',
  'ton',
  'm2',
  'm3',
  'km',
  'hora',
  'día',
  'mes',
  'caja',
  'paquete',
  'servicio',
];

export const UNIDAD_POR_DEFECTO = 'unidad';

export const normalizarUnidad = (valor, porDefecto = UNIDAD_POR_DEFECTO) =>
  String(valor ?? '').trim() || porDefecto;
