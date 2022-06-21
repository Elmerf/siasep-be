const {
  HOST, USER, PASSWORD, DB,
} = JSON.parse(process.env.DB_CREDENTIALS);

module.exports = {
  HOST,
  USER,
  PASSWORD,
  DB,
  dialect: 'mysql',
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};
