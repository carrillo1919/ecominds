export const up = async (queryInterface) => {
  await queryInterface.sequelize.query('ALTER TABLE "Empresas" ENABLE ROW LEVEL SECURITY;');
  await queryInterface.sequelize.query('ALTER TABLE "Documentos" ENABLE ROW LEVEL SECURITY;');
  await queryInterface.sequelize.query('ALTER TABLE "Auditorias" ENABLE ROW LEVEL SECURITY;');
  await queryInterface.sequelize.query('ALTER TABLE "AuditoriaItems" ENABLE ROW LEVEL SECURITY;');
  await queryInterface.sequelize.query('ALTER TABLE "Empleados" ENABLE ROW LEVEL SECURITY;');
  await queryInterface.sequelize.query('ALTER TABLE "EmpresaAsignaciones" ENABLE ROW LEVEL SECURITY;');
  await queryInterface.sequelize.query('ALTER TABLE "CalendarioEventos" ENABLE ROW LEVEL SECURITY;');
  await queryInterface.sequelize.query('ALTER TABLE "ArchivoAdjuntos" ENABLE ROW LEVEL SECURITY;');

  await queryInterface.sequelize.query(`
    CREATE POLICY IF NOT EXISTS empresas_tenant_isolation ON "Empresas"
      FOR ALL TO app_user
      USING (
        id = current_setting('app.current_empresa_id', true)::UUID
        OR current_setting('app.current_is_admin', true)::BOOLEAN
      )
      WITH CHECK (current_setting('app.current_is_admin', true)::BOOLEAN)
  `);

  await queryInterface.sequelize.query(`
    CREATE POLICY IF NOT EXISTS documentos_tenant_isolation ON "Documentos"
      FOR ALL TO app_user
      USING (
        empresa_id = current_setting('app.current_empresa_id', true)::UUID
        OR current_setting('app.current_is_admin', true)::BOOLEAN
      )
  `);

  await queryInterface.sequelize.query(`
    CREATE POLICY IF NOT EXISTS auditorias_tenant_isolation ON "Auditorias"
      FOR ALL TO app_user
      USING (
        empresa_id = current_setting('app.current_empresa_id', true)::UUID
        OR current_setting('app.current_is_admin', true)::BOOLEAN
      )
  `);

  await queryInterface.sequelize.query(`
    CREATE POLICY IF NOT EXISTS auditoria_items_tenant_isolation ON "AuditoriaItems"
      FOR ALL TO app_user
      USING (
        EXISTS (
          SELECT 1 FROM "Auditorias" a
          WHERE a.id = "AuditoriaItems".auditoria_id
            AND (
              a.empresa_id = current_setting('app.current_empresa_id', true)::UUID
              OR current_setting('app.current_is_admin', true)::BOOLEAN
            )
        )
      )
  `);

  await queryInterface.sequelize.query(`
    CREATE POLICY IF NOT EXISTS empleados_tenant_isolation ON "Empleados"
      FOR ALL TO app_user
      USING (
        empresa_id = current_setting('app.current_empresa_id', true)::UUID
        OR current_setting('app.current_is_admin', true)::BOOLEAN
      )
  `);

  await queryInterface.sequelize.query(`
    CREATE POLICY IF NOT EXISTS empresa_asignaciones_tenant_isolation ON "EmpresaAsignaciones"
      FOR ALL TO app_user
      USING (
        empresa_id = current_setting('app.current_empresa_id', true)::UUID
        OR current_setting('app.current_is_admin', true)::BOOLEAN
      )
  `);

  await queryInterface.sequelize.query(`
    CREATE POLICY IF NOT EXISTS calendario_eventos_tenant_isolation ON "CalendarioEventos"
      FOR ALL TO app_user
      USING (
        empresa_id = current_setting('app.current_empresa_id', true)::UUID
        OR current_setting('app.current_is_admin', true)::BOOLEAN
        OR empresa_id IS NULL
      )
  `);

  await queryInterface.sequelize.query(`
    CREATE POLICY IF NOT EXISTS archivo_adjuntos_tenant_isolation ON "ArchivoAdjuntos"
      FOR ALL TO app_user
      USING (
        EXISTS (
          SELECT 1 FROM "Documentos" d
          WHERE d.id = "ArchivoAdjuntos".documento_id
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
    ['EmpresaAsignaciones', 'empresa_asignaciones_tenant_isolation'],
    ['CalendarioEventos', 'calendario_eventos_tenant_isolation'],
    ['ArchivoAdjuntos', 'archivo_adjuntos_tenant_isolation'],
  ];
  for (const [table, policy] of tables) {
    await queryInterface.sequelize.query(`DROP POLICY IF EXISTS ${policy} ON "${table}";`);
    await queryInterface.sequelize.query(`ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY;`);
  }
};
