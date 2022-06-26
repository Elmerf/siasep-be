/* eslint-disable camelcase */
const { default: fetch } = require('node-fetch');
const { session } = require('../models');

// eslint-disable-next-line consistent-return
exports.checkFileExisted = async (req, res, next) => {
  const { tokenCache } = req.cookies;
  if (!tokenCache) {
    const url = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
    url.searchParams.append('client_id', process.env.CLIENT_ID);
    url.searchParams.append('scope', 'files.readwrite offline_access');
    url.searchParams.append('response_type', 'code');
    url.searchParams.append('login_hint', process.env.LOGIN_HINT);
    url.searchParams.append('redirect_uri', process.env.REDIRECT_URI);
    await fetch(url);
  }
  next();
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
