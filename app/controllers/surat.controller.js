/* eslint-disable camelcase */
const { default: fetch } = require('node-fetch');
const { Op, QueryTypes } = require('sequelize');
const { Client } = require('pg');
const db = require('../models');
const { categories, getAutomatedNomor } = require('../utils/helper.utils');
const { keys } = require('../utils/suratKeys');

const client = new Client({
  connectionString: `${process.env.DATABASE_URL}`,
  ssl: {
    rejectUnauthorized: false,
  },
});
client.connect();

const msGraph = 'https://graph.microsoft.com/v1.0';

const tokenParsed = async (req) => {
  const { tokenCache } = req.cookies;
  console.log(tokenCache);
  return JSON.parse(decodeURIComponent(tokenCache));
};

const {
  surat, detail, sequelize,
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

    const result = await client.query(`SELECT 
      "detail"."id", 
      "detail"."id_nadine", 
      "detail"."nomor_surat", 
      "detail"."nama_pengirim", 
      "detail"."nama_wp", 
      "detail"."npwp", 
      "detail"."perihal", 
      "detail"."tanggal_terima", 
      "detail"."tanggal_surat", 
      "detail"."nama_ar", 
      "detail"."nilai_data", 
      "detail"."disposisi", 
      "detail"."jenis_dokumen", 
      "detail"."keterangan", 
      "detail"."file", 
      "detail"."file_id" 
    FROM 
      "detail" AS "detail" 
    INNER JOIN "surat" AS "surat" 
      ON "detail"."nomor_surat" = "surat"."nomor_surat" 
      AND "surat"."tipe_surat" = $1 
      AND EXTRACT(YEAR FROM "createdAt") = $2;`, [id, year]);
    res.xls(`${tipe_surat}-${sub_surat}-${year}.xlsx`, result.rows, {
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
  try {
    const result = await client.query(`select ct.month, ct.surat_masuk, ct.surat_keluar 
    from (
      select 
        extract(month from s."createdAt") as month, 
        count(t.tipe_surat = 'masuk' or null) as surat_masuk,
        count(t.tipe_surat = 'keluar' or null) as surat_keluar
      from surat s
      inner join tipe t
      on t.id = s.tipe_surat 
      where extract(year from s."createdAt") = $1
      group by extract(month from s."createdAt")
    ) ct `, [year]);
    // console.log(result);
    res.send(result.rows);
  } catch (error) {
    console.log(error);
  }
};

exports.home = async (req, res) => {
  const count = await sequelize.query(`select ct.jumlah_surat, ct.tipe_surat 
  from (
    select count(s.nomor_surat) as jumlah_surat, t.tipe_surat
    from surat s
    inner join tipe t
    on t.id = s.tipe_surat 
    group by t.tipe_surat 
  ) ct 
  `, { type: QueryTypes.SELECT });
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
    if (!nomor_surat) {
      nomor_surat = await getAutomatedNomor(jenis, id);
    }
    if (file !== undefined) {
      const token = await tokenParsed(req);
      const filename = `${tipe_surat}-${sub_surat}-${Date.now()}.pdf`;
      const URI = new URL(`${msGraph}/me/drive/root:/siasep/${filename}:/content`);
      const result = await fetch(URI, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token.access_token}`,
        },
        body: file.buffer,
      });
      const info = (await result.json());
      file_path = info.webUrl;
      file_id = info.id;
    }

    const result = await sequelize.transaction(async (t) => {
      const data = await surat.create({
        nomor_surat, tipe_surat: id, pegawai_id,
      }, { transaction: t });

      const detailSurat = await detail.create({
        tanggal_terima: (tanggal_terima || null),
        id_nadine,
        tanggal_surat: (tanggal_surat || null),
        nama_pengirim,
        perihal,
        nama_wp,
        disposisi,
        file: file_path,
        file_id,
        npwp,
        nilai_data: (nilai_data || 0),
        jenis_dokumen,
        nama_ar,
        keterangan,
      }, { transaction: t });

      await data.setDetail(detailSurat, { transaction: t });
      return data;
    });
    res.send(result);
  } catch (err) {
    console.log(err);
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
      const token = await tokenParsed(req);
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
      const token = await tokenParsed(req);
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
  const { tipe_surat, sub_surat } = req.params;
  const {
    id,
    tanggal_terima = null,
    id_nadine,
    tanggal_surat = null,
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
      const token = await tokenParsed(req);
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
        const filename = `${tipe_surat}-${sub_surat}-${Date.now()}.pdf`;
        URI = new URL(`${msGraph}/me/drive/root:/siasep/${filename}:/content`);
      }

      const result = await fetch(URI, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token.access_token}`,
        },
        body: file.buffer,
      });
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
