import { env } from './environment';
import type { Knex } from 'knex';

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'mysql2',
    connection: {
      host: env.db.host,
      port: env.db.port,
      database: env.db.name,
      user: env.db.user,
      password: env.db.password,
      charset: 'utf8mb4',
      timezone: '+00:00',
    },
    pool: {
      min: env.db.poolMin,
      max: env.db.poolMax,
    },
    migrations: {
      directory: '../migrations',
      tableName: 'tourneo_knex_migrations',
      extension: 'ts',
    },
    seeds: {
      directory: '../seeds',
      extension: 'ts',
    },
  },
  production: {
    client: 'mysql2',
    connection: {
      host: env.db.host,
      port: env.db.port,
      database: env.db.name,
      user: env.db.user,
      password: env.db.password,
      charset: 'utf8mb4',
      timezone: '+00:00',
      ssl: { rejectUnauthorized: false },
    },
    pool: {
      min: env.db.poolMin,
      max: env.db.poolMax,
    },
    migrations: {
      directory: '../migrations',
      tableName: 'tourneo_knex_migrations',
      extension: 'ts',
    },
  },
};

module.exports = config;
export default config;