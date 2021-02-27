import express from 'express';
import { body, validationResult } from 'express-validator';
import xss from 'xss';
import { getSignatures, getNumberOfSignatures, sign } from './db.js';

export const router = express.Router();

const ssnPattern = '^[0-9]{6}-?[0-9]{4}$';

function getInfo() {
  return {
    name: '',
    name_invalid: false,
    ssn: '',
    ssn_invalid: false,
    errors: [],
  };
}

router.get('/', async (req, res, next) => { // eslint-disable-line
  const title = 'Undirskriftarlisti';
  const regInfo = getInfo();
  const signatures = await getSignatures();
  const totalItems = await getNumberOfSignatures();
  const itemsPerPage = 50;
  const pageNum = 0;
  const admin = false;

  res.render('index', {
    title, regInfo, signatures, totalItems, itemsPerPage, pageNum, admin,
  });
});

router.post('/',
  body('name')
    .trim()
    .escape(),
  body('name')
    .isLength({ min: 1 })
    .withMessage('Nafn má ekki vera tómt'),
  body('name')
    .isLength({ max: 128 })
    .withMessage('Nafn má ekki vera lengra en 128 stafir'),
  body('ssn')
    .matches(ssnPattern)
    .withMessage('Kennitala verður að vera á forminu 0000000000 eða 000000-0000'),
  body('ssn')
    .blacklist('-'),
  body('comment')
    .trim()
    .escape(),
  body('comment')
    .isLength({ max: 512 })
    .withMessage('Athugasemd getur ekki verið meira en 512 stafir'),
  async (req, res, next) => { // eslint-disable-line
    const regInfo = getInfo();
    let signatures = await getSignatures();
    const title = 'Undirskriftarlisti';

    const admin = false;

    const {
      name,
      ssn,
      comment,
      anon,
    } = req.body;

    const xssName = xss(name);
    const xssSsn = xss(ssn);
    const xssComment = xss(comment);
    const xssAnon = !!anon;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      errors.array().forEach((err) => {
        if (err.param === 'ssn') {
          regInfo.ssn_invalid = true;
        }
        if (err.param === 'name') {
          regInfo.name_invalid = true;
        }
      });
      regInfo.name = regInfo.name_invalid ? '' : xssName;
      regInfo.ssn = regInfo.ssn_invalid ? '' : xssSsn;
      regInfo.errors = errors.array();
      res.render('index', {
        regInfo, signatures, title, admin,
      });
      return;
    }
    // gögn eru OK

    const result = await sign([xssName, xssSsn, xssComment, xssAnon]);
    if (result !== 0) {
      res.redirect('/error');
      return;
    }

    signatures = await getSignatures();
    res.render('index', {
      title, regInfo, signatures, admin,
    });
  });

router.get('/error', (req, res, next) => { // eslint-disable-line
  res.render('error', { title: 'Gat ekki skráð!', text: 'Hafðir þú skrifað undir áður?' });
});
