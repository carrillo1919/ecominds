const ensurePolicy = async (queryInterface, table, policy, definition) => {
  const [policies] = await queryInterface.sequelize.query(
    'SELECT 1 FROM pg_policies WHERE schemaname = current_schema() AND tablename = :table AND policyname = :policy',
    { replacements: { table, policy } }
  );
  if (policies.length === 0) {
    await queryInterface.sequelize.query(`CREATE POLICY ${policy} ON "${table}" ${definition}`);
  }
};

export const up = async (queryInterface) => {
  await queryInterface.sequelize.query('ALTER TABLE "Empresas" ENABLE ROW LEVEL SECURITY;');
  await queryInterface.sequelize.query('ALTER TABLE "Documentos" ENABLE ROW LEVEL SECURITY;');
  await queryInterface.sequelize.query('ALTER TABLE "Auditorias" ENABLE ROW LEVEL SECURITY;');
  await queryInterface.sequelize.query('ALTER TABLE "AuditoriaItems" ENABLE ROW LEVEL SECURITY;');
  await queryInterface.sequelize.query('ALTER TABLE "Empleados" ENABLE ROW LEVEL SECURITY;');
  await queryInterface.sequelize.query('ALTER TABLE "empresa_asignaciones" ENABLE ROW LEVEL SECURITY;');
  await queryInterface.sequelize.query('ALTER TABLE "CalendarioEventos" ENABLE ROW LEVEL SECURITY;');
  await queryInterface.sequelize.query('ALTER TABLE "ArchivosAdjuntos" ENABLE ROW LEVEL SECURITY;');

  await ensurePolicy(queryInterface, 'Empresas', 'empresas_tenant_isolation', `
      FOR ALL TO CURRENT_USER
      USING (
        id = current_setting('app.current_empresa_id', true)::UUID
        OR current_setting('app.current_is_admin', true)::BOOLEAN
      )
      WITH CHECK (current_setting('app.current_is_admin', true)::BOOLEAN)
  `);

  await ensurePolicy(queryInterface, 'Documentos', 'documentos_tenant_isolation', `
      FOR ALL TO CURRENT_USER
      USING (
        empresa_id = current_setting('app.current_empresa_id', true)::UUID
        OR current_setting('app.current_is_admin', true)::BOOLEAN
      )
  `);

  await ensurePolicy(queryInterface, 'Auditorias', 'auditorias_tenant_isolation', `
      FOR ALL TO CURRENT_USER
      USING (
        "empresaId" = current_setting('app.current_empresa_id', true)::UUID
        OR current_setting('app.current_is_admin', true)::BOOLEAN
      )
  `);

  await ensurePolicy(queryInterface, 'AuditoriaItems', 'auditoria_items_tenant_isolation', `
      FOR ALL TO CURRENT_USER
      USING (
        EXISTS (
          SELECT 1 FROM "Auditorias" a
          WHERE a.id = "AuditoriaItems"."auditoriaId"
            AND (
              a."empresaId" = current_setting('app.current_empresa_id', true)::UUID
              OR current_setting('app.current_is_admin', true)::BOOLEAN
            )
        )
      )
  `);

  await ensurePolicy(queryInterface, 'Empleados', 'empleados_tenant_isolation', `
      FOR ALL TO CURRENT_USER
      USING (
        empresa_id = current_setting('app.current_empresa_id', true)::UUID
        OR current_setting('app.current_is_admin', true)::BOOLEAN
      )
  `);

  await ensurePolicy(queryInterface, 'empresa_asignaciones', 'empresa_asignaciones_tenant_isolation', `
      FOR ALL TO CURRENT_USER
      USING (
        empresa_id = current_setting('app.current_empresa_id', true)::UUID
        OR current_setting('app.current_is_admin', true)::BOOLEAN
      )
  `);

  await ensurePolicy(queryInterface, 'CalendarioEventos', 'calendario_eventos_tenant_isolation', `
      FOR ALL TO CURRENT_USER
      USING (
        "empresaId" = current_setting('app.current_empresa_id', true)::UUID
        OR current_setting('app.current_is_admin', true)::BOOLEAN
        OR "empresaId" IS NULL
      )
  `);

  await ensurePolicy(queryInterface, 'ArchivosAdjuntos', 'archivo_adjuntos_tenant_isolation', `
      FOR ALL TO CURRENT_USER
      USING (
        EXISTS (
          SELECT 1 FROM "Documentos" d
          WHERE d.id = "ArchivosAdjuntos".documento_id
            AND (
              d.empresa_id = current_setting('app.current_empresa_id', true)::UUID
              OR current_setting('app.current_is_admin', true)::BOOLEAN
            )
        )
      )
  `);
};

export const down = async (queryInterface) => {
  const tables = [
    ['Empresas', 'empresas_tenant_isolation'],
    ['Documentos', 'documentos_tenant_isolation'],
    ['Auditorias', 'auditorias_tenant_isolation'],
    ['AuditoriaItems', 'auditoria_items_tenant_isolation'],
    ['Empleados', 'empleados_tenant_isolation'],
    ['empresa_asignaciones', 'empresa_asignaciones_tenant_isolation'],
    ['CalendarioEventos', 'calendario_eventos_tenant_isolation'],
    ['ArchivosAdjuntos', 'archivo_adjuntos_tenant_isolation'],
  ];
  for (const [table, policy] of tables) {
    await queryInterface.sequelize.query(`DROP POLICY IF EXISTS ${policy} ON "${table}";`);
    await queryInterface.sequelize.query(`ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY;`);
  }
};
