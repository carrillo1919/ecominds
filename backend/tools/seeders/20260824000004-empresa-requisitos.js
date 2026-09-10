import { QueryTypes } from 'sequelize';

const asignaciones = [
  { rif: 'J-102345678', codigos: ['SIN-IVA-01', 'SIN-IT-02', 'SIN-IUE-03', 'GM-LF-01', 'GM-PUB-02'] },
  { rif: 'J-209876543', codigos: ['MT-PLA-01', 'MT-SEG-03', 'GM-RES-03', 'SIN-IVA-01'] },
];

export const up = async (queryInterface) => {
  const empresas = await queryInterface.sequelize.query(
    `SELECT id, rif FROM "Empresas" WHERE rif IN ('J-102345678', 'J-209876543')`,
    { type: QueryTypes.SELECT }
  );
  const byRif = Object.fromEntries(empresas.map((e) => [e.rif, e.id]));

  const requisitos = await queryInterface.sequelize.query(
    `SELECT id, codigo FROM requisitos_legales WHERE codigo LIKE 'SIN-%' OR codigo LIKE 'MT-%' OR codigo LIKE 'GM-%'`,
    { type: QueryTypes.SELECT }
  );
  const byCodigo = Object.fromEntries(requisitos.map((r) => [r.codigo, r.id]));

  const users = await queryInterface.sequelize.query(
    `SELECT id FROM "Users" WHERE email = 'responsable@srcd.local'`,
    { type: QueryTypes.SELECT }
  );
  const responsableId = users[0]?.id || null;

  for (const { rif, codigos } of asignaciones) {
    const empresaId = byRif[rif];
    if (!empresaId) continue;

    for (const codigo of codigos) {
      const requisitoId = byCodigo[codigo];
      if (!requisitoId) continue;

      await queryInterface.sequelize.query(
        `INSERT INTO empresa_requisitos (id, empresa_id, requisito_id,  fecha_asignacion, observaciones, created_at, updated_at)
         VALUES (gen_random_uuid(), :empresa_id, :requisito_id,  CURRENT_DATE, 'Asignación inicial de datos demo', NOW(), NOW())
         ON CONFLICT (empresa_id, requisito_id) DO NOTHING`,
        {
          replacements: { empresa_id: empresaId, requisito_id: requisitoId },
          type: QueryTypes.INSERT,
        }
      );
    }
  }
};

export const down = async (queryInterface) => {
  await queryInterface.sequelize.query(
    `DELETE FROM empresa_requisitos WHERE observaciones = 'Asignación inicial de datos demo'`,
    { type: QueryTypes.DELETE }
  );
};