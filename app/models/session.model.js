module.exports = (sequelize, Sequelize) => {
  const Session = sequelize.define('session', {
    username: {
      type: Sequelize.STRING,
      unique: true,
    },
    session_id: {
      type: Sequelize.UUID,
    },
    expired_date: {
      type: 'TIMESTAMP',
    },
  }, { freezeTableName: true, timestamps: false });

  return Session;
};
