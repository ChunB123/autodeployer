import { Sequelize, Model, DataTypes } from 'sequelize';

export const sequelize = new Sequelize(
 'walkthrough',
 'admin',
 '12345678',
  {
    host: 'awsopsdb.czymghbcjcna.us-west-2.rds.amazonaws.com',
    dialect: 'mysql',
    dialectOptions: {
      ssl:'Amazon RDS'
    }
  }
);

sequelize.authenticate().then(() => {
    console.log('Connection has been established successfully.');
  }).catch((error) => {
    console.error('Unable to connect to the database: ', error);
  })