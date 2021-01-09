export {}

const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env.personal') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const BASE_PATH = path.join(__dirname);

let connectionString = process.env.PG_DATABASE_URL;

module.exports = {
  client: 'pg',
  connection: connectionString,
  directory: path.join(BASE_PATH, 'migrations'),
  loadExtensions: ['.ts'],
};
