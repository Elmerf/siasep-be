require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { default: fetch } = require('node-fetch');
const json2xls = require('json2xls');
const cookieParser = require('cookie-parser');

const app = express();
const corsOptions = {
  origin: ['https://siasep.my.id', 'https://www.siasep.my.id'],
  credentials: true,
};
app.use(cors(corsOptions));

app.use(cookieParser());
app.use(json2xls.middleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = require('./app/models');
const { categories } = require('./app/utils/helper.utils');

db.sequelize.sync().then(() => {
  console.log('Drop & Re-sync db.');
});

const { checkFileExisted } = require('./app/middlewares/auth.middleware');

app.get('/', checkFileExisted, async (req, res) => {
  try {
    res.send('Hello!');
  } catch (err) {
    console.log(err);
  }
});

app.get('/redirect', async (req, res) => {
  const { code } = req.query;
  if (code) {
    const url = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/token');
    const result = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
      body: new URLSearchParams({
        client_id: process.env.CLIENT_ID,
        redirect_uri: process.env.REDIRECT_URI,
        client_secret: process.env.CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
      }),
    });
    const data = JSON.stringify(await result.json());
    res.cookie('tokenCache', data, {
      maxAge: 60 * 60 * 1000,
      sameSite: 'lax',
      secure: true,
    });
    res.redirect('/');
  }
});

app.get('/categories', async (req, res) => {
  const data = await categories;
  res.send(data);
});

require('./app/routes')(app);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`this server is running on port ${PORT}`);
});

module.exports = app;
