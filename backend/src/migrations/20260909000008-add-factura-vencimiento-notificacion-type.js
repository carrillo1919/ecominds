export const up = async (queryInterface) => {
  await queryInterface.sequelize.query(
    "ALTER TYPE \"enum_notificacion_logs_tipo\" ADD VALUE IF NOT EXISTS 'factura_vencimiento';"
  );
};

export const down = async () => {
  // PostgreSQL no permite eliminar un valor ENUM de forma segura.
};