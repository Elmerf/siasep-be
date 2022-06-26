const { checkFileExisted, checkSessionUUID } = require('../middlewares/auth.middleware');
const surat = require('./surat.route');
const auth = require('./auth.route');
const user = require('./user.route');

module.exports = (app) => {
  app.use('/surat', [
    checkFileExisted,
    // checkTokenValid,
    checkSessionUUID,
  //   (req, res, next) => {
  //   if (fs.existsSync('./tokenCache.json')) {
  //     const token = fs.readFileSync('./tokenCache.json');
  //     const tokenParsed = JSON.parse(token);
  //     res.set('Authorization', `Bearer ${tokenParsed.access_token}`);
  //   }
  //   next();
  // }
  ], surat);
  app.use('/auth', auth);
  app.use('/user', user);
};
