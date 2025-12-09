import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    // 1. Nombre total d'utilisateurs
    const totalUsers = await this.prisma.user.count();

    // 2. Argent total en circulation (Somme des wallets)
    const wallets = await this.prisma.wallet.findMany();
    const totalMoneyInCirculation = wallets.reduce((sum, w) => sum + Number(w.balance), 0);

    // 3. Tes gains (Somme des frais 'fee' dans les transactions)
    const transactions = await this.prisma.transaction.findMany();
    const totalFees = transactions.reduce((sum, t) => sum + Number(t.fee), 0);

    // 4. Dernières transactions
    const lastTransactions = await this.prisma.transaction.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { senderWallet: { include: { user: true } } }
    });

    return {
      totalUsers,
      totalMoney: totalMoneyInCirculation / 100, // En DH
      totalProfit: totalFees / 100, // En DH (C'est ta richesse !)
      lastTransactions
    };
  }
}