import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DatabaseService {
  constructor(private dataSource: DataSource) {}

  async initializeDatabase() {
    const sqlPath = path.join(__dirname, '../../..', 'database', 'init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    try {
      await this.dataSource.query(sql);
      return { success: true, message: 'Database schema initialized successfully' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}
