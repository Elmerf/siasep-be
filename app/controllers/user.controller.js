/* eslint-disable camelcase */
const bcryptjs = require('bcryptjs');
const { pegawai, session } = require('../models');

exports.info = async (req, res) => {
  try {
    const { username = '' } = req.cookies;

    const info = await pegawai.findOne({
      where: {
        username,
      },
    });

    res.send(info);
  } catch (err) {
    console.log(err);
  }
};

exports.all = async (req, res) => {
  try {
    const result = await pegawai.findAll({ attributes: { exclude: ['password'] } });

    res.send(result);
  } catch (error) {
    console.log(error);
  }
};

exports.add = async (req, res) => {
  const { nama, isAdmin } = req.body;

  if (!nama) res.status(401).send('Field Nama Kosong');

  else {
    try {
      const username = `username_${Math.floor(Math.random() * 90000) + 10000}`;
      const password = bcryptjs.hashSync(username);

      await pegawai.create({
        username,
        password,
        nama,
        isAdmin,
      });

      res.send({ msg: 'OK' });
    } catch (error) {
      console.log(error);
    }
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { username, new_password = '' } = req.body;

    let newPassword;

    if (!new_password) {
      newPassword = Math.random().toString(36).substring(2, 8);
    } else {
      newPassword = new_password;
    }

    const password = bcryptjs.hashSync(newPassword);
    await pegawai.update({ password }, {
      where: {
        username,
      },
    });

    res.send({ newPassword });
  } catch (error) {
    console.log(error);
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { username } = req.params;

    await pegawai.destroy({
      where: {
        username,
      },
    });

    res.send({ msg: 'DELETED' });
  } catch (error) {
    console.log(error);
  }
};

exports.changeAdminStatus = async (req, res) => {
  try {
    const { username } = req.params;
    const { isAdmin } = req.body;

    await pegawai.update({ isAdmin }, {
      where: {
        username,
      },
    });

    res.send({ msg: 'OK' });
  } catch (error) {
    console.log(error);
  }
};

exports.changeUsername = async (req, res) => {
  try {
    const { username, new_username } = req.body;
    await pegawai.update({ username: new_username }, {
      where: {
        username,
      },
    });

    res.send({ msg: 'OK' });
  } catch (error) {
    console.log(error);
  }
};

exports.changeName = async (req, res) => {
  try {
    const { username, new_name } = req.body;
    await pegawai.update({ nama: new_name }, {
      where: {
        username,
      },
    });

    res.send({ msg: 'OK' });
  } catch (error) {
    console.log(error);
  }
};

exports.logout = async (req, res) => {
  try {
    const { username } = req.body;

    await session.destroy({
      where: {
        username,
      },
    });

    res.send({ msg: 'DELETED' });
  } catch (error) {
    console.log(error);
  }
};
