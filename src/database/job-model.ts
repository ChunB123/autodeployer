import { sequelize } from './db-setup';
import { Sequelize, Model, DataTypes } from 'sequelize';

export const Job = sequelize.define("Job", {
    projectid: {
      type: DataTypes.STRING,
      allowNull: false
    },
    jobid: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false
    },
    s3directory: {
      type: DataTypes.STRING,
      allowNull: false
    }, 
    volumeid: {
      type: DataTypes.STRING,
      allowNull: false
    }
  });
