const bcryptjs = require('bcryptjs');
const crypto = require('crypto');
const { pegawai, session } = require('../models');

exports.login = async (req, res) => {
  const { username = '', password = '' } = req.body;

  const result = await pegawai.findOne({
    where: { username },
    raw: true,
  });

  if (!result) return res.status(401).send({ msg: 'Username tidak ditemukan!' });

  if (!bcryptjs.compareSync(password, result.password)) return res.status(401).send({ msg: 'Username atau Password salah!' });

  const UUID = crypto.randomUUID();
  const DAY = 24 * 60 * 60 * 1000;
  const expired = new Date(Date.now() + (DAY * 7)).toISOString().slice(0, 19).replace('T', ' ');

  const found = await session.findOne({ where: { username } });

  if (!found) {
    session.create({
      username,
      session_id: UUID,
      expired_date: expired,
    });
  } else {
    session.update({
      session_id: UUID,
      expired_date: expired,
    }, { where: { username } });
  }

  return res.send({ msg: 'OK', admin: !!result.isAdmin, session_id: UUID });
};
