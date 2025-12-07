import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  // Configuration du temps d'attente (20 secondes au lieu de 5)
  private transactionOptions = {
    maxWait: 5000, // Temps max pour attendre que la base soit dispo
    timeout: 20000 // Temps max pour exécuter la transaction (20s)
  };

  // --- 1. TRANSFERT D'ARGENT ---
  async transferMoney(senderId: string, receiverPhone: string, amount: number, pin: string) {
    const amountInCentimes = Math.floor(amount * 100);
    const fee = 0; 

    if (amount <= 0) throw new BadRequestException("Montant invalide");

    return await this.prisma.$transaction(async (tx) => {
      const sender = await tx.user.findUnique({ where: { id: senderId } });
      if (!sender) throw new UnauthorizedException("Utilisateur introuvable");
      if (sender.pinCode !== pin) throw new UnauthorizedException("Code PIN incorrect !");

      const senderWallet = await tx.wallet.findFirst({ where: { userId: senderId } });
      if (!senderWallet) throw new BadRequestException("Portefeuille expéditeur introuvable");
      if (senderWallet.balance < (amountInCentimes + fee)) throw new BadRequestException("Solde insuffisant");

      const receiverUser = await tx.user.findUnique({ where: { phoneNumber: receiverPhone }, include: { wallets: true } });
      if (!receiverUser) throw new BadRequestException("Destinataire introuvable");
      
      const receiverWallet = receiverUser.wallets[0];
      if (!receiverWallet) throw new BadRequestException("Portefeuille destinataire introuvable");

      if (senderWallet.id === receiverWallet.id) throw new BadRequestException("Envoi à soi-même impossible");

      await tx.wallet.update({ where: { id: senderWallet.id }, data: { balance: { decrement: amountInCentimes + fee } } });
      await tx.wallet.update({ where: { id: receiverWallet.id }, data: { balance: { increment: amountInCentimes } } });

      const transaction = await tx.transaction.create({
        data: {
          amount: amountInCentimes, fee: fee, type: 'TRANSFER', status: 'COMPLETED',
          senderWalletId: senderWallet.id, receiverWalletId: receiverWallet.id
        }
      });
      return { status: 'SUCCESS', message: 'Transfert réussi', transactionId: transaction.idString };
    }, this.transactionOptions); // <--- AJOUT DU TIMEOUT ICI
  }

  // --- 2. PAIEMENT FACTURE ---
  async payBill(userId: string, billType: string, contractNumber: string, amount: number, pin: string) {
    const amountInCentimes = Math.floor(amount * 100);
    const fee = 200; // 2 DH

    if (amount <= 0) throw new BadRequestException("Montant invalide");

    return await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new UnauthorizedException("Utilisateur introuvable");
      if (user.pinCode !== pin) throw new UnauthorizedException("Code PIN incorrect !");

      const wallet = await tx.wallet.findFirst({ where: { userId } });
      if (!wallet) throw new BadRequestException("Portefeuille introuvable");
      if (wallet.balance < (amountInCentimes + fee)) throw new BadRequestException(`Solde insuffisant (Frais: 2.00 DH)`);

      await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { decrement: amountInCentimes + fee } } });

      const transaction = await tx.transaction.create({
        data: {
          amount: amountInCentimes, fee: fee, type: 'BILL_PAYMENT', status: 'COMPLETED',
          senderWalletId: wallet.id
        }
      });
      return { status: 'SUCCESS', message: `Facture ${billType} payée`, transactionId: transaction.idString };
    }, this.transactionOptions); // <--- AJOUT DU TIMEOUT ICI
  }

  // --- 3. RECHARGE ---
  async rechargeWallet(userId: string, amount: number, source: string) {
    const amountInCentimes = Math.floor(amount * 100);
    if (amount <= 0) throw new BadRequestException("Montant invalide");

    return await this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findFirst({ where: { userId } });
      if (!wallet) throw new BadRequestException("Portefeuille introuvable");

      await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { increment: amountInCentimes } } });
      
      const transaction = await tx.transaction.create({
        data: { amount: amountInCentimes, fee: 0, type: 'DEPOSIT', status: 'COMPLETED', receiverWalletId: wallet.id }
      });
      return { status: 'SUCCESS', message: `Recharge réussie`, transactionId: transaction.idString };
    }, this.transactionOptions); // <--- AJOUT DU TIMEOUT ICI
  }

  // --- 4. GENERER CODE (ADMIN) ---
  async generateVoucher(amount: number) {
    const amountInCentimes = Math.floor(amount * 100);
    const code = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    const voucher = await this.prisma.voucher.create({ data: { code: code, amount: amountInCentimes, status: 'VALID' } });
    return { message: "Code généré", code: voucher.code, amount: amount };
  }

  // --- 5. UTILISER CODE ---
  async useVoucher(userId: string, code: string) {
    return await this.prisma.$transaction(async (tx) => {
      const voucher = await tx.voucher.findUnique({ where: { code } });
      if (!voucher) throw new BadRequestException("Code invalide");
      if (voucher.status === 'USED') throw new BadRequestException("Code déjà utilisé");

      const wallet = await tx.wallet.findFirst({ where: { userId } });
      if (!wallet) throw new BadRequestException("Portefeuille introuvable");

      await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { increment: voucher.amount } } });
      await tx.voucher.update({ where: { id: voucher.id }, data: { status: 'USED', usedById: userId, usedAt: new Date() } });

      await tx.transaction.create({
        data: { amount: voucher.amount, fee: 0, type: 'VOUCHER_DEPOSIT', status: 'COMPLETED', receiverWalletId: wallet.id }
      });
      return { status: 'SUCCESS', message: `Recharge réussie !`, amount: Number(voucher.amount)/100 };
    }, this.transactionOptions); // <--- AJOUT DU TIMEOUT ICI
  }

  // --- 6. RETRAIT (CASH OUT) ---
  async requestWithdrawal(userId: string, amount: number, pin: string) {
    const amountInCentimes = Math.floor(amount * 100);
    let fee = Math.floor(amountInCentimes * 0.01); 
    if (fee < 500) fee = 500; 

    if (amount <= 0) throw new BadRequestException("Montant invalide");

    return await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new UnauthorizedException("Utilisateur introuvable");
      if (user.pinCode !== pin) throw new UnauthorizedException("Code PIN incorrect !");

      const wallet = await tx.wallet.findFirst({ where: { userId } });
      if (!wallet) throw new BadRequestException("Portefeuille introuvable");
      
      const totalToDebit = amountInCentimes + fee;
      if (wallet.balance < totalToDebit) throw new BadRequestException(`Solde insuffisant (Frais: ${(fee/100)} DH)`);

      const otpCode = Math.floor(1000 + Math.random() * 9000).toString();

      await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { decrement: totalToDebit } } });

      const withdrawal = await tx.withdrawalCode.create({
        data: {
          code: otpCode,
          amount: amountInCentimes,
          userId: userId,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
          status: 'PENDING'
        }
      });

      await tx.transaction.create({
        data: { amount: amountInCentimes, fee: fee, type: 'WITHDRAWAL_REQUEST', status: 'PENDING', senderWalletId: wallet.id }
      });

      return { status: 'SUCCESS', message: `Code généré. Frais: ${fee/100} DH`, otpCode: otpCode, expiresIn: '15 minutes' };
    }, this.transactionOptions); // <--- AJOUT DU TIMEOUT ICI
  }

  // --- 8. ANNULER RETRAIT ---
  async cancelWithdrawal(userId: string, code: string) {
    return await this.prisma.$transaction(async (tx) => {
      const withdrawal = await tx.withdrawalCode.findUnique({ where: { code } });
      if (!withdrawal) throw new BadRequestException("Code introuvable");
      if (withdrawal.status !== 'PENDING') throw new BadRequestException("Code invalide");
      if (withdrawal.userId !== userId) throw new UnauthorizedException("Non autorisé");

      const wallet = await tx.wallet.findFirst({ where: { userId } });
      if (!wallet) throw new BadRequestException("Wallet introuvable");

      let fee = Math.floor(Number(withdrawal.amount) * 0.01);
      if (fee < 500) fee = 500;
      const totalToRefund = Number(withdrawal.amount) + fee;

      await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { increment: totalToRefund } } });
      await tx.withdrawalCode.update({ where: { id: withdrawal.id }, data: { status: 'CANCELLED' } });

      await tx.transaction.create({
        data: { amount: withdrawal.amount, fee: 0, type: 'WITHDRAWAL_REFUND', status: 'COMPLETED', receiverWalletId: wallet.id }
      });

      return { status: 'SUCCESS', message: 'Remboursement effectué', refundedAmount: totalToRefund / 100 };
    }, this.transactionOptions); // <--- AJOUT DU TIMEOUT ICI
  }

  // --- HISTORIQUE ---
  async getMyTransactions(userId: string) {
    const wallet = await this.prisma.wallet.findFirst({ where: { userId } });
    if(!wallet) return [];
    return this.prisma.transaction.findMany({
      where: { OR: [{ senderWalletId: wallet.id }, { receiverWalletId: wallet.id }] },
      orderBy: { createdAt: 'desc' },
      include: { senderWallet: { include: { user: true } }, receiverWallet: { include: { user: true } } }
    });
  }
}