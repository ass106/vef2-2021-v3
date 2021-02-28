import fs from 'fs';
import faker from 'faker';
import moment from 'moment';
import util from 'util';
import { randomDate, getRandomInt, getRandomSSN } from './utils.js';
import { query, formatQuery } from './db.js';

const readFileAsync = util.promisify(fs.readFile);

async function main() {
  try {
    const createTable = await readFileAsync('./sql/schema.sql');
    await query(createTable.toString('utf8'));
    console.info('Tafla búin til');
  } catch (e) {
    console.error('Villa við að búa til töflu:', e.message);
    return;
  }

  const signees = [];

  for (let i = 1; i <= 500; i += 1) {
    const randomName = faker.name.findName();
    const randomSSN = getRandomSSN();
    const comment = getRandomInt(0, 100) > 50 ? '' : faker.lorem.sentence();
    const anonymous = !(getRandomInt(0, 100) > 50);
    const signature = randomDate(moment().subtract(14, 'days').toDate(), moment().toDate());

    signees.push([randomName, randomSSN, comment, anonymous, signature]);
  }

  formatQuery('INSERT INTO signatures(name, nationalid, comment, anonymous, signed) VALUES %L returning *;', signees);

  console.info(`Sett inn í töflu ${signees.length} feik prófílar.`);
}

main().catch((err) => {
  console.error(err);
});
