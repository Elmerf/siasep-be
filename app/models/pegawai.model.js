module.exports = (sequelize, Sequelize) => {
  const Pegawai = sequelize.define('pegawai', {
    username: {
      type: Sequelize.STRING,
      unique: true,
    },
    nama: {
      type: Sequelize.STRING,
    },
    password: {
      type: Sequelize.STRING,
    },
    isAdmin: {
      type: Sequelize.BOOLEAN,
    },
  }, { freezeTableName: true });

  return Pegawai;
};
