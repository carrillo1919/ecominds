// Reglas de cálculo de la matriz de riesgo (RF-03.2 y RF-03.3).

const ESTADOS = ['cumple', 'no_cumple', 'na'];

const UMBRAL_MEDIO = 15;
const UMBRAL_ALTO = 30;

const NIVELES = ['BAJO', 'MEDIO', 'ALTO'];

const redondear = (valor) => Math.round(valor * 100) / 100;

const nivelPorPorcentaje = (porcentaje) => {
  if (porcentaje >= UMBRAL_ALTO) return 'ALTO';
  if (porcentaje >= UMBRAL_MEDIO) return 'MEDIO';
  return 'BAJO';
};

const escalarNivel = (nivel, cantidadCriticos) => {
  if (!cantidadCriticos) return nivel;

  const indice = NIVELES.indexOf(nivel);
  const nuevo = Math.min(
    indice + (cantidadCriticos >= 2 ? 2 : 1),
    NIVELES.length - 1,
  );

  return NIVELES[nuevo];
};

const calcularResultado = (items = []) => {
  const totalRequisitos = items.length;
  const totalNoAplica = items.filter((i) => i.estado === 'na').length;
  const totalCumple = items.filter((i) => i.estado === 'cumple').length;
  const totalNoCumple = items.filter((i) => i.estado === 'no_cumple').length;
  const totalSinEvaluar = items.filter((i) => !i.estado).length;

  const aplicables = totalRequisitos - totalNoAplica;

  const porcentajeNoCumplimiento = aplicables > 0
    ? redondear((totalNoCumple / aplicables) * 100)
    : 0;

  const porcentajeCumplimiento = aplicables > 0
    ? redondear((totalCumple / aplicables) * 100)
    : 0;

  const hallazgosCriticos = items
    .filter((i) => i.estado === 'no_cumple' && i.requisito?.critico)
    .map((i) => ({
      codigo: i.requisito.codigo,
      bloque: i.requisito.bloque,
      requisito: i.requisito.requisito,
      observaciones: i.observaciones || null,
    }));

  const nivelBase = nivelPorPorcentaje(porcentajeNoCumplimiento);
  const nivelRiesgo = escalarNivel(nivelBase, hallazgosCriticos.length);

  const bloquesMap = new Map();

  items.forEach((item) => {
    const bloque = item.requisito?.bloque || 'Sin bloque';

    if (!bloquesMap.has(bloque)) {
      bloquesMap.set(bloque, {
        bloque,
        total: 0,
        cumple: 0,
        noCumple: 0,
        noAplica: 0,
      });
    }

    const acc = bloquesMap.get(bloque);
    acc.total += 1;

    if (item.estado === 'cumple') acc.cumple += 1;
    if (item.estado === 'no_cumple') acc.noCumple += 1;
    if (item.estado === 'na') acc.noAplica += 1;
  });

  const bloques = [...bloquesMap.values()].map((bloque) => {
    const aplicablesBloque = bloque.total - bloque.noAplica;
    const porcentajeBloque = aplicablesBloque > 0
      ? redondear((bloque.noCumple / aplicablesBloque) * 100)
      : 0;

    return {
      ...bloque,
      aplicables: aplicablesBloque,
      porcentajeCumplimiento: aplicablesBloque > 0
        ? redondear((bloque.cumple / aplicablesBloque) * 100)
        : 0,
      porcentajeNoCumplimiento: porcentajeBloque,
      nivelRiesgo: nivelPorPorcentaje(porcentajeBloque),
    };
  });

  return {
    totalRequisitos,
    totalCumple,
    totalNoCumple,
    totalNoAplica,
    totalSinEvaluar,
    aplicables,
    porcentajeCumplimiento,
    porcentajeNoCumplimiento,
    nivelBase,
    nivelRiesgo,
    riesgoEscalado: nivelRiesgo !== nivelBase,
    hallazgosCriticos,
    bloques,
  };
};

export {
  ESTADOS,
  NIVELES,
  UMBRAL_MEDIO,
  UMBRAL_ALTO,
  nivelPorPorcentaje,
  escalarNivel,
  calcularResultado,
};
