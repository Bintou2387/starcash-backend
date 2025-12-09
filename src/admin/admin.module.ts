import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PrismaService } from '../prisma.service'; // <--- Import

@Module({
  controllers: [AdminController],
  providers: [AdminService, PrismaService], // <--- Ajout ici
})
export class AdminModule {}