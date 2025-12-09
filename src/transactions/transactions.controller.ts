import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('send')
  sendMoney(@Body() body: { senderId: string; receiverPhone: string; amount: number; pin: string }) {
    // On passe le PIN au service
    return this.transactionsService.transferMoney(body.senderId, body.receiverPhone, body.amount, body.pin);
  }

  @Post('bill')
  payBill(@Body() body: { userId: string; billType: string; contractNumber: string; amount: number; pin: string }) {
    // On passe le PIN au service
    return this.transactionsService.payBill(body.userId, body.billType, body.contractNumber, body.amount, body.pin);
  }

  @Post('recharge')
  recharge(@Body() body: { userId: string; amount: number; source: string }) {
    return this.transactionsService.rechargeWallet(body.userId, body.amount, body.source);
  }

  // Créer un code (Pour tester, on le fait via API, normalement c'est un Back-office admin)
  @Post('voucher/generate')
  generateVoucher(@Body() body: { amount: number }) {
    return this.transactionsService.generateVoucher(body.amount);
  }

  // Utiliser un code
  @Post('voucher/use')
  useVoucher(@Body() body: { userId: string; code: string }) {
    return this.transactionsService.useVoucher(body.userId, body.code);
  }

  // ... autres routes ...

  @Post('withdraw')
  requestWithdrawal(@Body() body: { userId: string; amount: number; pin: string }) {
    return this.transactionsService.requestWithdrawal(body.userId, body.amount, body.pin);
  }

  // ... autres routes ...

  @Post('withdraw/cancel')
  cancelWithdrawal(@Body() body: { userId: string; code: string }) {
    return this.transactionsService.cancelWithdrawal(body.userId, body.code);
  }

  // ... autres routes ...

  @Post('cards/add')
  addCard(@Body() body: { userId: string; number: string; holder: string; expiry: string; cvv: string }) {
    return this.transactionsService.addCard(body.userId, body.number, body.holder, body.expiry, body.cvv);
  }

  @Get('cards/:userId')
  getMyCards(@Param('userId') userId: string) {
    return this.transactionsService.getMyCards(userId);
  }

  @Get('history/:userId')
  getHistory(@Param('userId') userId: string) {
    return this.transactionsService.getMyTransactions(userId);
  }
}

