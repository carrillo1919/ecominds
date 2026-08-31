import bcrypt from 'bcryptjs';

const ROLES = ['admin', 'auditor', 'responsable', 'lector'];

const UserModel = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
    apellido: { type: DataTypes.STRING, allowNull: false },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
      set(value) {
        this.setDataValue('email', String(value || '').trim().toLowerCase());
      },
    },
    password: { type: DataTypes.STRING, allowNull: false },
    rol: { type: DataTypes.ENUM(...ROLES), allowNull: false, defaultValue: 'lector' },
    verified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    verificationToken: DataTypes.STRING,
    resetPasswordToken: DataTypes.STRING,
    resetPasswordExpires: DataTypes.DATE,
    refreshTokenHash: DataTypes.STRING,
    activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  }, {
    tableName: 'Users',
    timestamps: true,
    defaultScope: {
      attributes: {
        exclude: [
          'password',
          'verificationToken',
          'resetPasswordToken',
          'resetPasswordExpires',
          'refreshTokenHash',
        ],
      },
    },
    scopes: { withSecrets: { attributes: { include: [] } } },
    hooks: {
      beforeSave: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  });

  User.ROLES = ROLES;

  User.prototype.comparePassword = function comparePassword(plain) {
    return bcrypt.compare(plain, this.password);
  };

  User.prototype.toPublicJSON = function toPublicJSON() {
    return {
      id: this.id,
      nombre: this.nombre,
      apellido: this.apellido,
      email: this.email,
      rol: this.rol,
      verified: this.verified,
      activo: this.activo,
      createdAt: this.createdAt,
    };
  };

  User.prototype.hasRole = function hasRole(...roles) {
    return roles.flat().includes(this.rol);
  };

  User.associate = (db) => {
    User.hasMany(db.Empresa, { foreignKey: 'responsableId', as: 'empresasResponsable' });
    User.hasOne(db.Empleado, { foreignKey: 'userId', as: 'empleado' });
  };

  return User;
};

export default UserModel;
