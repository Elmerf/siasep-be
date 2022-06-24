/* eslint-disable camelcase */
const fs = require('fs/promises');
const { default: fetch } = require('node-fetch');
const { Op } = require('sequelize');
const db = require('../models');
const { categories, getAutomatedNomor } = require('../utils/helper.utils');
const { keys } = require('../utils/suratKeys');

const msGraph = 'https://graph.microsoft.com/v1.0';

const tokenParsed = async () => {
  const token = await fs.readFile('./tmp/tokenCache.json');
  return JSON.parse(token);
};

const {
  surat, detail, sequelize, tipe,
} = db;

async function getCategoriesID(tp, sub) {
  const cats = await categories;
  return cats[tp].filter((el) => el.sub_surat === sub.replace(/-/g, '_'))[0].id;
}

exports.excel = async (req, res) => {
  const { tipe_surat, sub_surat } = req.params;
  const { year } = req.query;

  try {
    const id = await getCategoriesID(tipe_surat, sub_surat);

    const result = await detail.findAll({
      include: {
        model: surat,
        attributes: [],
        where: {
          tipe_surat: id,
          createdAt: sequelize.where(sequelize.fn('YEAR', sequelize.col('createdAt')), year),
        },
      },
      raw: true,
    });
    res.xls(`${tipe_surat}-${sub_surat}-${year}.xlsx`, result, {
      fields: keys[tipe_surat][sub_surat],
    });
  } catch (err) {
    console.log(err);
  }
};

exports.recent = async (req, res) => {
  const result = await surat.findAll({
    include: ['tipe'],
    limit: 6,
    order: [['createdAt', 'DESC']],
  });
  res.send(result);
};

exports.graph = async (req, res) => {
  const year = new Date().getFullYear();
  const stat = await surat.findAll({
    attributes: [
      [sequelize.fn('MONTH', sequelize.col('createdAt')), 'month'],
      [
        sequelize.literal('SUM(tipe.tipe_surat = "masuk")'),
        'surat_masuk',
      ],
      [
        sequelize.literal('SUM(tipe.tipe_surat = "keluar")'),
        'surat_keluar',
      ],
    ],
    include: {
      model: tipe,
      attributes: [],
    },
    where: sequelize.where(sequelize.fn('YEAR', sequelize.col('createdAt')), year),
    group: sequelize.fn('MONTH', sequelize.col('createdAt')),
  });
  res.send(stat);
};

exports.home = async (req, res) => {
  const count = await surat.findAll({
    include: {
      model: tipe,
      attributes: ['tipe_surat'],
    },
    attributes: [[sequelize.fn('count', 'surat.nomor_surat'), 'jumlah_surat']],
    group: 'tipe.tipe_surat',
  });
  res.send(count);
};

exports.create = async (req, res) => {
  try {
    const { tipe_surat, sub_surat } = req.params;
    const {
      tanggal_terima,
      id_nadine,
      tanggal_surat,
      nama_pengirim,
      perihal,
      nama_wp,
      disposisi,
      npwp,
      nilai_data,
      jenis_dokumen,
      jenis,
      nama_ar,
      keterangan,
      pegawai_id = 1,
    } = req.body;
    let { nomor_surat } = req.body;
    const { file } = req;
    let file_path = '';
    let file_id = '';

    const id = await getCategoriesID(tipe_surat, sub_surat);
    console.log(id);
    if (!nomor_surat) {
      nomor_surat = await getAutomatedNomor(jenis, id);
    }

    if (file !== undefined) {
      const uploadFile = await fs.readFile(`../../tmp/uploads/${file.filename}`);
      const token = await tokenParsed();
      const URI = new URL(`${msGraph}/me/drive/root:/siasep/${file.filename}:/content`);
      const result = await fetch(URI, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token.access_token}`,
        },
        body: uploadFile,
      });
      fs.unlink(`../../tmp/uploads/${file.filename}`);
      const info = (await result.json());
      file_path = info.webUrl;
      file_id = info.id;
    }

    const result = await sequelize.transaction(async (t) => {
      const data = await surat.create({
        nomor_surat, tipe_surat: id, pegawai_id,
      }, { transaction: t });
      const detailSurat = await detail.create({
        tanggal_terima,
        id_nadine,
        tanggal_surat,
        nama_pengirim,
        perihal,
        nama_wp,
        disposisi,
        file: file_path,
        file_id,
        npwp,
        nilai_data,
        jenis_dokumen,
        nama_ar,
        keterangan,
      }, { transaction: t });
      await data.setDetail(detailSurat, { transaction: t });
      return data;
    });
    res.send(result);
  } catch (err) {
    res.status(500).send({ msg: 'Surat tidak berhasil disimpan!' });
  }
};

exports.delete = async (req, res) => {
  const { nomor_surat } = req.query;

  try {
    const file = await detail.findOne({
      where: {
        nomor_surat,
      },
      attributes: ['file_id'],
      raw: true,
    });

    if (file.file_id) {
      const URI = new URL(`${msGraph}/me/drive/items/${file.file_id}`);
      const token = await tokenParsed();
      await fetch(URI, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token.access_token}`,
        },
      });
    }
    // eslint-disable-next-line arrow-body-style
    const response = await sequelize.transaction(async (t) => {
      // eslint-disable-next-line no-return-await
      return await surat.destroy({ where: { nomor_surat }, transaction: t });
    });
    if (response >= 1) res.send({ msg: 'Berhasil dihapus!' });
    else res.status(500).send({ msg: 'Terjadi kesalahan, tidak dapat menghapus!' });
  } catch (err) {
    res.status(400).send({ msg: 'Surat tidak berhasil dihapus!' });
  }
};

exports.findAllByType = async (req, res) => {
  const { tipe_surat, sub_surat } = req.params;
  const { page = 1, keyword = '' } = req.query;

  try {
    const id = await getCategoriesID(tipe_surat, sub_surat);
    const { count, rows } = await surat.findAndCountAll({
      include: {
        model: detail,
        where: {
          [Op.or]: {
            nomor_surat: { [Op.substring]: keyword },
            perihal: { [Op.substring]: keyword },
            disposisi: { [Op.substring]: keyword },
          },
        },
      },
      order: [['updatedAt', 'DESC']],
      where: {
        tipe_surat: id,
      },
      offset: (page ? (page - 1) * 10 : 0),
      limit: 10,
    });
    const length = Math.ceil(count / 10);
    res.send({ rows, length });
  } catch (err) {
    res.status(500).send({ msg: 'Kesalahan ketika mengambil data.' });
  }
};

exports.preview = async (req, res) => {
  const { nomor_surat } = req.query;

  try {
    const file = await detail.findOne({
      where: {
        nomor_surat,
      },
      attributes: ['file_id'],
      raw: true,
    });

    if (file.file_id) {
      const URI = new URL(`${msGraph}/me/drive/items/${file.file_id}/createLink`);
      const token = await tokenParsed();
      const result = await fetch(URI, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token.access_token}`,
        },
        body: JSON.stringify({ type: 'embed', scope: 'anonymous' }),
      });
      const { webUrl } = (await result.json()).link;
      res.send(webUrl);
    } else {
      res.send({ msg: 'Tidak ada file yang terunggah' });
    }
  } catch (err) {
    console.log(err);
  }
};

exports.update = async (req, res) => {
  const {
    id,
    tanggal_terima,
    id_nadine,
    tanggal_surat,
    nomor_surat,
    nama_pengirim,
    perihal,
    nama_wp,
    npwp,
    nilai_data,
    jenis_dokumen,
    nama_ar,
    disposisi,
    keterangan,
  } = req.body;
  const { file } = req;

  let file_path;
  let file_id;

  try {
    if (file !== undefined) {
      const token = await tokenParsed();
      const searchedFile = await detail.findOne({
        where: {
          nomor_surat,
        },
        attributes: ['file_id'],
        raw: true,
      });

      let URI;
      if (searchedFile.file_id) {
        URI = new URL(`${msGraph}/me/drive/items/${searchedFile.file_id}/content`);
      } else {
        URI = new URL(`${msGraph}/me/drive/root:/siasep/${file.filename}:/content`);
      }

      const uploadFile = await fs.readFile(`../../tmp/uploads/${file.filename}`);
      const result = await fetch(URI, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token.access_token}`,
        },
        body: uploadFile,
      });
      fs.unlink(`../../tmp/uploads/${file.filename}`);
      const info = (await result.json());
      file_path = info.webUrl;
      file_id = info.id;
    }

    const result = await sequelize.transaction(async (t) => {
      await surat.update({ nomor_surat }, {
        where: {
          id,
        },
        transaction: t,
        raw: true,
      });
      const newData = await surat.findOne({
        where: {
          id,
        },
        attributes: ['nomor_surat'],
        raw: true,
        transaction: t,
      });
      const detailSurat = await detail.update({
        tanggal_terima,
        id_nadine,
        tanggal_surat,
        nama_pengirim,
        perihal,
        nama_wp,
        npwp,
        nilai_data,
        jenis_dokumen,
        nama_ar,
        disposisi,
        file: file_path,
        file_id,
        keterangan,
      }, {
        where: {
          nomor_surat: newData.nomor_surat,
        },
        transaction: t,
      });
      return detailSurat;
    });
    res.send(result);
  } catch (err) {
    console.log(err);
  }
};
