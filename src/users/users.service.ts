import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // 1. Inscription
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
          pinCode: createUserDto.pinCode || "0000", // On sauve le PIN
          wallets: {
            create: {
              currency: 'MAD',
              balance: 0,
            },
          },
        },
        include: {
          wallets: true,
        },
      });

      const { passwordHash, ...result } = newUser;
      return result;

    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Ce numéro de téléphone ou email existe déjà.');
      }
      throw error;
    }
  }

  // 2. Voir tous
  findAll() {
    return this.prisma.user.findMany({ include: { wallets: true } });
  }

  // 3. Voir un seul
  findOne(id: string) {
    return this.prisma.user.findUnique({ where: { id }, include: { wallets: true } });
  }

  // 4. METTRE A JOUR LA PHOTO (C'est la nouvelle fonction !)
  async updateAvatar(userId: string, base64Image: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatar: base64Image },
    });
  }
}