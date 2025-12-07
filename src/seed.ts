// Fichier: src/seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('⏳ Démarrage du peuplement de la base (Seed)...');

  // On prépare le mot de passe crypté une seule fois
  const passwordHash = await bcrypt.hash('123456', 10);

  // --- 1. CRÉATION DE MOHAMED TRAORE ---
  try {
    const mohamed = await prisma.user.create({
      data: {
        phoneNumber: '+212600000001',
        email: 'mohamed@starcash.com',
        fullName: 'Mohamed TRAORE',
        passwordHash: passwordHash,
        wallets: {
          create: {
            currency: 'MAD',
            balance: 100000, // 1000 DH
          },
        },
      },
    });
    console.log('✅ SUCCÈS : Mohamed TRAORE créé.');
  } catch (e) {
    console.log('⚠️ INFO : Mohamed existe déjà (on passe au suivant).');
  }

  // --- 2. CRÉATION DE FATIMA ZAHRA ---
  try {
    const fatima = await prisma.user.create({
      data: {
        phoneNumber: '+212699999999',
        email: 'fatima@starcash.com',
        fullName: 'Fatima ZAHRA',
        passwordHash: passwordHash,
        wallets: {
          create: {
            currency: 'MAD',
            balance: 0, // Solde vide
          },
        },
      },
    });
    console.log('✅ SUCCÈS : Fatima ZAHRA créée.');
  } catch (e) {
    console.log('⚠️ INFO : Fatima existe déjà.');
  }
}

main()
  .catch((e) => {
    console.error('❌ Erreur critique :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });