import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express'; // <--- Import nécessaire

async function bootstrap() {
  (BigInt.prototype as any).toJSON = function () { return Number(this); };

  const app = await NestFactory.create(AppModule);
  
  // ON AUGMENTE LA LIMITE DE TAILLE POUR LES PHOTOS
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  app.enableCors();
  await app.listen(3000, '0.0.0.0');
}
bootstrap();