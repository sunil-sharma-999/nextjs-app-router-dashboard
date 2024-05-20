import sqlite3, { RunResult } from 'sqlite3';

const db = new sqlite3.Database(`${process.cwd()}/app/lib/db/sqlite.db`);

export function dbQuery<K>(sql: string, keyword = 'all'): Promise<K> {
  return new Promise(function (resolve, reject) {
    // @ts-ignore
    if (!db[keyword]) {
      reject('Error');
    } else {
      // @ts-ignore
      db[keyword](sql, function (error: Error, result: RunResult) {
        if (error) reject(error);
        else resolve(result as unknown as K);
      });
    }
  });
}

export default db;
