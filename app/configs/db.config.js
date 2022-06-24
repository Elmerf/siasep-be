// const {
//   HOST, USER, PASSWORD, DB,
// } = JSON.parse(process.env.DB_CREDENTIALS);

// console.log(process.env.DB_CREDENTIALS);
const pg = require('pg');

module.exports = {
  // HOST,
  // USER,
  // PASSWORD,
  // DB,
  PORT: 5432,
  dialect: 'postgres',
  dialectModule: pg,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};
