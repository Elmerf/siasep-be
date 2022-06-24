// const {
//   HOST, USER, PASSWORD, DB,
// } = JSON.parse(process.env.DB_CREDENTIALS);

// console.log(process.env.DB_CREDENTIALS);

module.exports = {
  // HOST,
  // USER,
  // PASSWORD,
  // DB,
  PORT: 5432,
  dialect: 'postgres',
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};
