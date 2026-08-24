// Reglas de riesgo (espejo del backend: services/riesgoService.js)
export const UMBRAL_MEDIO = 15;
export const UMBRAL_ALTO = 30;

export const ESTADOS = [
  { valor: 'cumple', label: 'Cumple' },
  { valor: 'no_cumple', label: 'No cumple' },
  { valor: 'na', label: 'No aplica' },
];

export const estadoLabel = (estado) =>
  ({ cumple: 'Cumple', no_cumple: 'No cumple', na: 'No aplica' }[estado] || 'Sin evaluar');

export const nivelPorPorcentaje = (porcentaje) => {
  if (porcentaje >= UMBRAL_ALTO) return 'ALTO';
  if (porcentaje >= UMBRAL_MEDIO) return 'MEDIO';
  return 'BAJO';
};

export const riesgoClase = (nivel) =>
  ({ BAJO: 'pill pill--ok', MEDIO: 'pill pill--warn', ALTO: 'pill pill--danger' }[nivel] || 'pill');

const redondear = (valor) => Math.round(valor * 100) / 100;

// Calculo local para mostrar el resultado mientras se llena el checklist.
export const calcularResultado = (items = []) => {
  const totalRequisitos = items.length;
  const totalNoAplica = items.filter((i) => i.estado === 'na').length;
  const totalCumple = items.filter((i) => i.estado === 'cumple').length;
  const totalNoCumple = items.filter((i) => i.estado === 'no_cumple').length;
  const totalSinEvaluar = items.filter((i) => !i.estado).length;
  const aplicables = totalRequisitos - totalNoAplica;

  const porcentajeNoCumplimiento = aplicables > 0 ? redondear((totalNoCumple / aplicables) * 100) : 0;
  const porcentajeCumplimiento = aplicables > 0 ? redondear((totalCumple / aplicables) * 100) : 0;

  const criticos = items.filter((i) => i.estado === 'no_cumple' && i.requisito?.critico);
  const nivelBase = nivelPorPorcentaje(porcentajeNoCumplimiento);

  const niveles = ['BAJO', 'MEDIO', 'ALTO'];
  const salto = criticos.length >= 2 ? 2 : criticos.length ? 1 : 0;
  const nivelRiesgo = niveles[Math.min(niveles.indexOf(nivelBase) + salto, 2)];

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
    hallazgosCriticos: criticos.map((i) => i.requisito),
  };
};

export const fechaCorta = (valor) => {
  if (!valor) return '-';
  const d = new Date(`${String(valor).slice(0, 10)}T00:00:00`);
  return d.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' });
};
