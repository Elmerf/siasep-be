module.exports = (sequelize, Sequelize) => {
  const Tipe = sequelize.define('tipe', {
    tipe_surat: {
      type: Sequelize.STRING,
    },
    sub_surat: {
      type: Sequelize.STRING,
    },
  }, { freezeTableName: true, timestamps: false });

  return Tipe;
};
