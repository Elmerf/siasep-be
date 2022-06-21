const Sequelize = require('sequelize');
const config = require('../configs/db.config');

const sequelize = new Sequelize(
  config.DB,
  config.USER,
  config.PASSWORD,
  {
    host: config.HOST,
    dialect: config.dialect,
    operatorsAliases: false,
    pool: {
      max: config.pool.max,
      min: config.pool.min,
      acquire: config.pool.acquire,
      idle: config.pool.idle,
    },
  },
);

const db = {};
db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.pegawai = require('./pegawai.model')(sequelize, Sequelize);
db.surat = require('./surat.model')(sequelize, Sequelize);
db.detail = require('./detail.model')(sequelize, Sequelize);
db.tipe = require('./tipe.model')(sequelize, Sequelize);
db.session = require('./session.model')(sequelize, Sequelize);

db.pegawai.hasMany(db.surat, {
  foreignKey: 'pegawai_id',
});
db.surat.belongsTo(db.pegawai, {
  foreignKey: 'pegawai_id',
});

db.tipe.hasMany(db.surat, {
  foreignKey: 'tipe_surat',
});
db.surat.belongsTo(db.tipe, {
  foreignKey: 'tipe_surat',
});

db.surat.hasOne(db.detail, {
  sourceKey: 'nomor_surat',
  foreignKey: 'nomor_surat',
  onDelete: 'CASCADE',
});
db.detail.belongsTo(db.surat, {
  targetKey: 'nomor_surat',
  foreignKey: 'nomor_surat',
});

db.pegawai.hasOne(db.session, {
  sourceKey: 'username',
  foreignKey: 'username',
  onDelete: 'CASCADE',
});

db.session.belongsTo(db.pegawai, {
  targetKey: 'username',
  foreignKey: 'username',
  onDelete: 'CASCADE',
});

module.exports = db;
