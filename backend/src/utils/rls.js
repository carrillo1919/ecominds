import { sequelize } from '../models/index.js';

/**
 * Aplica el contexto de RLS en una transacción de Sequelize.
 * Debe ejecutarse justo después de iniciar la transacción y antes
 * de cualquier operación sobre tablas protegidas.
 */
export const applyRlsContext = async (transaction, req) => {
  const scope = req.scope || {};
  const empresaId = scope.all ? null : scope.empresaIds?.[0] || null;
  const isAdmin = scope.all || false;

  await sequelize.query(
    "SELECT set_config('app.current_empresa_id', :empresaId, true)",
    {
      replacements: {
        empresaId: empresaId || '00000000-0000-0000-0000-000000000000',
      },
      transaction,
    }
  );
  await sequelize.query(
    "SELECT set_config('app.current_is_admin', :isAdmin, true)",
    { replacements: { isAdmin: String(isAdmin) }, transaction }
  );
};
