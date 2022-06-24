const router = require('express').Router();
const multer = require('multer');
const surat = require('../controllers/surat.controller');

const upload = multer({
  storage: multer.diskStorage({
    destination: './tmp/uploads/',
    filename(req, file, cb) {
      const { path } = req;
      const pathSplited = path.split('/');
      cb(null, `${pathSplited[1]}-${pathSplited[2]}-${Date.now()}.pdf`);
    },
  }),
});

router.get('/recent', surat.recent);
router.get('/graph', surat.graph);
router.get('/home', surat.home);
router.get('/preview', surat.preview);
router.get('/:tipe_surat/:sub_surat', surat.findAllByType);
router.get('/:tipe_surat/:sub_surat/excel', surat.excel);
router.put('/:tipe_surat/:sub_surat', upload.single('file_surat'), surat.update);
router.post('/:tipe_surat/:sub_surat', upload.single('file_surat'), surat.create);
router.delete('', surat.delete);

module.exports = router;
