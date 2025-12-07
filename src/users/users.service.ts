import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service'; // On importe notre connecteur
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

 // Cherche la partie "data" dans la fonction create et ajoute pinCode:
async create(createUserDto: any) {
    const saltOrRounds = 10;
    const hashedPassword = await bcrypt.hash(createUserDto.password, saltOrRounds);

    try {
      const newUser = await this.prisma.user.create({
        data: {
          phoneNumber: createUserDto.phoneNumber,
          email: createUserDto.email,
          fullName: createUserDto.fullName,
          passwordHash: hashedPassword,
          pinCode: createUserDto.pinCode, // <--- AJOUTE CETTE LIGNE ICI (Pour sauver le PIN choisi)
          wallets: {
            create: { currency: 'MAD', balance: 0 },
          },
        },
        include: { wallets: true },
      });

      // 3. On nettoie la réponse (on retire le mot de passe avant d'envoyer)
      const { passwordHash, ...result } = newUser;
      return result;

    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Ce numéro de téléphone ou email existe déjà.');
      }
      throw error;
    }
  }

  findAll() {
    return this.prisma.user.findMany({ include: { wallets: true } });
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({ where: { id }, include: { wallets: true } });
  }
}