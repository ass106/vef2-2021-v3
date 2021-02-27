import express from 'express';
import { getSignatures, getNumberOfSignatures, deleteSignature } from './db.js';

// TODO útfæra „bakvinnslu“

export const router = express.Router();

function getInfo() {
  return {
    name: '',
    name_invalid: false,
    ssn: '',
    ssn_invalid: false,
    errors: [],
  };
}

router.get('/admin', async (req, res, next) => { // eslint-disable-line
  const title = 'Þú ert admin';
  const regInfo = getInfo();
  const signatures = await getSignatures();
  const totalItems = await getNumberOfSignatures();
  const itemsPerPage = 50;
  const pageNum = 0;
  const admin = true;

  res.render('admin', {
    title, regInfo, signatures, totalItems, itemsPerPage, pageNum, admin,
  });
});

router.post('/delete', async (req, res, next) => { // eslint-disable-line
  const regInfo = getInfo();
  let signatures = await getSignatures();
  const title = 'Undirskriftarlisti';
  const admin = true;

  const result = await deleteSignature(req.query.id);
  if (result !== 0) {
    res.redirect('/error');
    return;
  }

  signatures = await getSignatures();
  res.redirect('/admin');
  res.render('index', {
    title, regInfo, signatures, admin,
  });
});
