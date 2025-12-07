import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // --- DEBUT DU PATCH MAGIQUE ---
  // On apprend à l'application à transformer les "Gros Chiffres" en nombres normaux pour le téléphone
  (BigInt.prototype as any).toJSON = function () {
    return Number(this);
  };
  // --- FIN DU PATCH MAGIQUE ---

  const app = await NestFactory.create(AppModule);
  
  // On permet au téléphone de se connecter de n'importe où (CORS)
  app.enableCors(); 
  
  // On écoute sur toutes les interfaces réseau (important pour le mobile)
  await app.listen(3000, '0.0.0.0'); 
}
bootstrap();