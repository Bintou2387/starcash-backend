// Fichier: src/seed.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('👑 Promotion du PDG en cours...');

  // Remplace ce numéro par CELUI avec lequel tu te connectes (Mohamed)
  const myPhoneNumber = "+212600000001"; 

  try {
    const ceo = await prisma.user.update({
      where: { phoneNumber: myPhoneNumber },
      data: { role: 'ADMIN' } // <--- C'est ici le pouvoir !
    });
    console.log(`✅ SUCCÈS ! ${ceo.fullName} est maintenant ADMIN.`);
  } catch (e) {
    console.log("❌ Erreur : Utilisateur introuvable. Vérifie le numéro.");
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());