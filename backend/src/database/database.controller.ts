import { Controller, Post } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Controller('database')
export class DatabaseController {
  constructor(private databaseService: DatabaseService) {}

  @Post('init')
  async initDatabase() {
    return await this.databaseService.initializeDatabase();
  }
}
