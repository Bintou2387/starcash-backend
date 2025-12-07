import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { PrismaService } from '../prisma.service'; // <--- 1. On l'importe

@Module({
  controllers: [TransactionsController],
  providers: [
    TransactionsService, 
    PrismaService // <--- 2. On l'ajoute ici pour que le module puisse l'utiliser
  ],
})
export class TransactionsModule {}