module.exports = (sequelize, Sequelize) => {
  const Surat = sequelize.define('surat', {
    nomor_surat: {
      type: Sequelize.STRING,
      unique: true,
    },
  }, { freezeTableName: true });

  return Surat;
};
