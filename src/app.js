import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';

import passport from './login.js';
import { router as registrationRouter } from './registration.js';
import { router as adminRoute } from './admin.js';

dotenv.config();

const {
  PORT: port = 3000,
  // SESSION_SECRET: sessionSecret,
  DATABASE_URL: connectionString,
} = process.env;

if (!connectionString) { // || !sessionSecret) {
  console.error('Vantar gögn í env');
  process.exit(1);
}

const app = express();

const path = dirname(fileURLToPath(import.meta.url));

// Það sem verður notað til að dulkóða session gögnin
const sessionSecret = 'leyndarmál';

app.use(express.static(join(path, './public')));
app.use(express.urlencoded({ extended: true }));

// Erum að vinna með form, verðurm að nota body parser til að fá aðgang
// að req.body
app.use(express.urlencoded({ extended: true }));

// Passport mun verða notað með session
app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  maxAge: 20 * 1000, // 20 sek
}));

app.set('views', './views');
app.set('view engine', 'ejs');

app.use(registrationRouter);
app.use(adminRoute);

function errorHandler(err, req, res, next) { // eslint-disable-line
  console.error(err); // eslint-disable-line
  res.send('error');
}

// Látum express nota passport með session
app.use(passport.initialize());
app.use(passport.session());

// Gott að skilgreina eitthvað svona til að gera user hlut aðgengilegan í
// viewum ef við erum að nota þannig
app.use((req, res, next) => {
  if (req.isAuthenticated()) {
    // getum núna notað user í viewum
    res.locals.user = req.user;
  }

  next();
});

app.get('/login', (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }

  let message = '';
  const title = 'Skráðu þig inn';

  // Athugum hvort einhver skilaboð séu til í session, ef svo er birtum þau
  // og hreinsum skilaboð
  if (req.session.messages && req.session.messages.length > 0) {
    message = req.session.messages.join(', ');
    req.session.messages = [];
  }

  // Ef við breytum name á öðrum hvorum reitnum að neðan mun ekkert virka
  // nema við höfum stillt í samræmi, sjá línu 64
  return res.render('login', { message, title });
});

app.post(
  '/login',

  // Þetta notar strat að ofan til að skrá notanda inn
  passport.authenticate('local', {
    failureMessage: 'Notandanafn eða lykilorð vitlaust.',
    failureRedirect: '/login',
  }),

  // Ef við komumst hingað var notandi skráður inn, senda á /admin
  (req, res) => {
    res.redirect('/admin');
  },
);

app.get('/logout', (req, res) => {
  // logout hendir session cookie og session
  req.logout();
  res.redirect('/');
});

app.use(errorHandler);

app.listen(port, () => {
  console.info(`App running on http://localhost:${port}`); // eslint-disable-line
});
