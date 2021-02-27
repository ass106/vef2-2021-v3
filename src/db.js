import pg from 'pg';
import dotenv from 'dotenv';
import format from 'pg-format';

dotenv.config();

const {
  DATABASE_URL: connectionString,
  NODE_ENV: nodeEnv = 'development',
} = process.env;

// Notum SSL tengingu við gagnagrunn ef við erum *ekki* í development mode, þ.e.a.s. á local vél
const ssl = nodeEnv !== 'development' ? { rejectUnauthorized: false } : false;

const pool = new pg.Pool({ connectionString, ssl });

pool.on('error', (err) => {
  console.error('Villa í tengingu við gagnagrunn, forrit hættir', err);
  process.exit(-1);
});

export async function query(_query, values = []) {
  const client = await pool.connect();

  try {
    const result = await client.query(_query, values);
    return result;
  } finally {
    client.release();
  }
}

export async function formatQuery(_query, values = []) {
  const client = await pool.connect();

  try {
    const result = await client.query(format(_query, values));
    return result;
  } finally {
    client.release();
  }
}

export async function getSignatures() {
  const client = await pool.connect();
  const qy = 'select * from signatures;';
  let rows = [];
  try {
    const result = await client.query(qy);
    rows = result.rows;
  } catch (e) {
    console.error('Error selecting', e);
  } finally {
    client.release();
  }
  return rows;
}

export async function getNumberOfSignatures() {
  const client = await pool.connect();
  const qy = 'SELECT COUNT(*) AS count FROM signatures;';
  let count = 0;
  try {
    const result = await client.query(qy);
    count = result;
  } catch (e) {
    console.error('Error getting count', e);
  } finally {
    client.release();
  }

  return count;
}

export const sign = async (signature) => {
  const client = await pool.connect();
  const qy = 'INSERT INTO signatures(name, nationalid, comment, anonymous) values($1, $2, $3, $4) returning *;';
  try {
    await client.query(qy, signature);
  } catch (e) {
    if (e.code === '23505' && e.constraint === 'signatures_nationalid_key') {
      return -1;
    }
    console.error('Error selecting', e.code);
  } finally {
    client.release();
  }
  return 0;
};

export const deleteSignature = async (id) => {
  const client = await pool.connect();
  const qy = 'DELETE FROM signatures WHERE id = $1;';

  try {
    await client.query(qy, [id]);
  } catch (e) {
    if (e.code === '23505' && e.constraint === 'signatures_id_primary_key') {
      return -1;
    }
    console.error('Error deleting', e.code);
  } finally {
    client.release();
  }
  return 0;
};
// TODO rest af föllum
