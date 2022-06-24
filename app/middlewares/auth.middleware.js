/* eslint-disable camelcase */
const fs = require('fs');
const { default: fetch } = require('node-fetch');
const { session } = require('../models');

exports.checkFileExisted = (req, res, next) => {
  if (!fs.existsSync('../../tmp/tokenCache.json')) {
    const url = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
    url.searchParams.append('client_id', process.env.CLIENT_ID);
    url.searchParams.append('scope', 'files.readwrite offline_access');
    url.searchParams.append('response_type', 'code');
    url.searchParams.append('login_hint', process.env.LOGIN_HINT);
    url.searchParams.append('redirect_uri', process.env.REDIRECT_URI);
    res.redirect(url);
  }
  next();
};

exports.checkTokenValid = async (req, res, next) => {
  try {
    if (fs.existsSync('../../tmp/tokenCache.json')) {
      const token = fs.statSync('../../tmp/tokenCache.json');
      if ((Date.now() - token.ctime) / 1000 > 3600) {
        await fetch('https://siasep-be.herokuapp.com/token');
      }
    }
    next();
  } catch (err) {
    console.log(err);
  }
};

// eslint-disable-next-line consistent-return
exports.checkSessionUUID = async (req, res, next) => {
  try {
    const { username = '', session_id = '' } = req.cookies;

    if (!username || !session_id) return res.status(401).send({ msg: 'Unauthorized!' });

    const result = await session.findOne({
      where: {
        username,
        session_id,
      },
      raw: true,
    });

    if (!result) { res.status(401).send({ msg: 'Login terlebih dahulu' }); } else if (result.expired_date < Date.now()) {
      session.destroy({ where: { username } });
      return res.status(401).send({ msg: 'Session habis' });
    } else {
      next();
    }
  } catch (err) {
    console.log(err);
    return res.status(500).send(err);
  }
};
