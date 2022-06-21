module.exports = (sequelize, Sequelize) => {
  const Detail = sequelize.define('detail', {
    id_nadine: {
      type: Sequelize.STRING,
    },
    nomor_surat: {
      type: Sequelize.STRING,
    },
    nama_pengirim: {
      type: Sequelize.STRING,
    },
    nama_wp: {
      type: Sequelize.STRING,
    },
    npwp: {
      type: Sequelize.STRING,
    },
    perihal: {
      type: Sequelize.STRING,
    },
    tanggal_terima: {
      type: Sequelize.DATEONLY,
    },
    tanggal_surat: {
      type: Sequelize.DATEONLY,
    },
    nama_ar: {
      type: Sequelize.STRING,
    },
    nilai_data: {
      type: Sequelize.INTEGER,
    },
    disposisi: {
      type: Sequelize.STRING,
    },
    jenis_dokumen: {
      type: Sequelize.STRING,
    },
    keterangan: {
      type: Sequelize.TEXT,
    },
    file: {
      type: Sequelize.STRING,
    },
    file_id: {
      type: Sequelize.STRING,
    },
  }, { freezeTableName: true, timestamps: false });

  return Detail;
};
