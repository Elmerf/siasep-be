/* eslint-disable consistent-return */
/* eslint-disable camelcase */
/* eslint-disable no-param-reassign */
const { Op } = require('sequelize');
const { tipe, surat } = require('../models');

exports.categories = tipe.findAll({ order: [['tipe_surat', 'DESC'], ['sub_surat', 'ASC']] }).then((data) => {
  const result = data.reduce((current, value) => {
    current[value.tipe_surat] = current[value.tipe_surat] || [];
    current[value.tipe_surat].push({ id: value.id, sub_surat: value.sub_surat });
    return current;
  }, {});
  return result;
});

// eslint-disable-next-line camelcase
exports.getAutomatedNomor = async (jenis_surat, tipe_surat) => {
  const year = new Date().getFullYear();
  const latestSurat = await surat.findOne({
    where: {
      nomor_surat: { [Op.endsWith]: year },
      // eslint-disable-next-line camelcase
      tipe_surat,
    },
    order: [
      ['id', 'DESC'],
    ],
  });

  if (!latestSurat) {
    if (jenis_surat === 'LAP-PPH') return `LAP-1/PPH/WPJ.05/KP.1108/${year}`;
    return `${jenis_surat}-1/WPJ.05/KP.1118/${year}`;
  }

  const nextNomor = parseInt(latestSurat.nomor_surat.split('/')[0].split('-')[1], 10) + 1;

  if (jenis_surat === 'LAP-PPH') return `LAP-${nextNomor}/PPH/WPJ.05/KP.1108/${year}`;
  return `${jenis_surat}-${nextNomor}/WPJ.05/KP.1118/${year}`;
};
