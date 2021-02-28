export function getInfo() {
  return {
    name: '',
    name_invalid: false,
    ssn: '',
    ssn_invalid: false,
    errors: [],
  };
}

/**
 * Higher-order fall sem umlykur async middleware með villumeðhöndlun.
 *
 * @param {function} fn Middleware sem grípa á villur fyrir
 * @returns {function} Middleware með villumeðhöndlun
 */
export function catchErrors(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

export function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

export function getRandomInt(min, max) {
  return Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1)) + Math.ceil(min);
}

export function getRandomSSN() {
  const date = randomDate(new Date(getRandomInt(1975, 2020), 0, 1), new Date());
  const year = date.toISOString().substring(2, 4);
  const month = date.toISOString().substring(5, 7);
  const day = date.toISOString().substring(8, 10);

  const firstSix = day + month + year;

  const multipliers = [3, 2, 7, 6, 5, 4, 3, 2];
  let allEight = firstSix + getRandomInt(20, 99).toString();

  let security = 0;
  const eightAsArray = allEight.split('');

  for (let i = 0; i < 8; i += 1) {
    security += eightAsArray[i] * multipliers[i];
  }

  security = 11 - (security % 11);
  if (security > 9) {
    security = 0;
  }

  allEight += security;
  if (eightAsArray[4] === '0') {
    allEight += 0;
  } else {
    allEight += 9;
  }

  return allEight;
}

/**
 * Passar upp á að það sé innskráður notandi í request. Skilar næsta middleware
 * ef svo er, annars redirect á /login
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @param {function} next Næsta middleware
 */
export function ensureLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.redirect('/login');
}
