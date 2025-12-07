import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaService } from '../prisma.service'; // <--- Import Important

@Module({
  controllers: [UsersController],
  providers: [UsersService, PrismaService], // <--- Ajouté ici
})
export class UsersModule {}