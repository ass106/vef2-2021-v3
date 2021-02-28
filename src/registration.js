import express from 'express';
import { body, validationResult } from 'express-validator';
import xss from 'xss';
import {
  getSignatures, getNumberOfSignatures, sign, deleteRow, query,
} from './db.js';
import { catchErrors, getInfo, ensureLoggedIn } from './utils.js';

export const router = express.Router();

const nationalIdPattern = '^[0-9]{6}-?[0-9]{4}$';

async function index(req, res) {
  const errors = [];

  const regInfo = getInfo();
  const numberOfItems = Number(await getNumberOfSignatures());
  const ITEMS_PER_PAGE = 50;
  const page = +req.query.page || 1;

  const signatures = await getSignatures((page - 1) * ITEMS_PER_PAGE);

  res.render('index', {
    errors,
    regInfo,
    signatures,
    numberOfItems,
    currentPage: page,
    hasNextPage: (ITEMS_PER_PAGE * page) < numberOfItems,
    hasPreviousPage: page > 1,
    nextPage: page + 1,
    previousPage: page - 1,
    lastPage: Math.ceil(numberOfItems / ITEMS_PER_PAGE),
    title: 'Undirskriftarlisti',
  });
}

const validationMiddleware = [
  body('name')
    .isLength({ min: 1 })
    .withMessage('Nafn má ekki vera tómt'),
  body('name')
    .isLength({ max: 128 })
    .withMessage('Nafn má að hámarki vera 128 stafir'),
  body('ssn')
    .isLength({ min: 1 })
    .withMessage('Kennitala má ekki vera tóm'),
  body('ssn')
    .matches(new RegExp(nationalIdPattern))
    .withMessage('Kennitala verður að vera á formi 000000-0000 eða 0000000000'),
  body('comment')
    .isLength({ max: 400 })
    .withMessage('Athugasemd má að hámarki vera 400 stafir'),
];

// Viljum keyra sér og með validation, ver gegn „self XSS“
const xssSanitizationMiddleware = [
  body('name').customSanitizer((v) => xss(v)),
  body('ssn').customSanitizer((v) => xss(v)),
  body('comment').customSanitizer((v) => xss(v)),
  body('anonymous').customSanitizer((v) => xss(v)),
];

const sanitizationMiddleware = [
  body('name').trim().escape(),
  body('ssn').blacklist('-'),
];

async function validationCheck(req, res, next) {
  const {
    name, ssn, comment, anonymous,
  } = req.body;

  const result = await query('SELECT COUNT(*) AS count FROM signatures;');
  const numberOfItems = Number(result.rows[0].count);
  const ITEMS_PER_PAGE = 50;
  const page = +req.query.page || 1;

  const signatures = await getSignatures((page - 1) * ITEMS_PER_PAGE);
  
  const formData = {
    name, ssn, comment, anonymous,
  };

  const validation = validationResult(req);

  if (!validation.isEmpty()) {
    return res.render('index', {
      regInfo: formData,
      errors: validation.errors,
      signatures,
      numberOfItems,
      currentPage: page,
      hasNextPage: (ITEMS_PER_PAGE * page) < numberOfItems,
      hasPreviousPage: page > 1,
      nextPage: page + 1,
      previousPage: page - 1,
      lastPage: Math.ceil(numberOfItems / ITEMS_PER_PAGE),
      title: 'Undirskriftarlisti',
    });
  }

  return next();
}

router.get('/', catchErrors(index));

async function register(req, res) {
  const {
    name, ssn, comment, anonymous,
  } = req.body;

  let success = false;

  try {
    success = await sign({
      name, ssn, comment, anonymous,
    });
  } catch (e) {
    console.error(e);
  }

  if (success) {
    return res.redirect('/');
  }

  return res.render('error', { title: 'Gat ekki skráð!', text: 'Hafðir þú skrifað undir áður?' });
}

/**
 * Route til að eyða undirskrift, tekur við `id` í `body` og eyðir.
 * Aðeins aðgengilegt fyrir innskráðan notanda.
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 */
async function deleteSignature(req, res) {
  const { id } = req.body;

  let result = null;

  try {
    result = await deleteRow(id);
  } catch (e) {
    console.error(e);
  }

  if (result.rowCount === 1) {
    return res.redirect('/admin');
  }

  return res.render('error', { title: 'Gat ekki eytt!', text: 'Villa við að eyða úr gagnagrunni' });
}

router.post('/delete', ensureLoggedIn, catchErrors(deleteSignature));
router.post(
  '/',
  validationMiddleware,
  xssSanitizationMiddleware,
  catchErrors(validationCheck),
  sanitizationMiddleware,
  catchErrors(register),
);

router.get('/error', (req, res, next) => { // eslint-disable-line
  res.render('error', { title: 'Gat ekki skráð!', text: 'Hafðir þú skrifað undir áður?' });
});
