var Sql = require('sequelize');
var sql = new Sql('sql_testing', 'domil@sqlserverd', 'qwert12345!', {
  host: 'sqlserverd.database.windows.net',
  dialect: 'mssql',
  driver: 'tedious',
  options: {
    encrypt: true,
    database: 'sql_testing'
  },
  port: 1433,
  pool: {
    max: 5,
    min: 0,
    idle: 10000
  },
  dialectOptions: {
    encrypt: true
  }
});

sql
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });