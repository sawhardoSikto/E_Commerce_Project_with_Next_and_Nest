import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common/pipes/validation.pipe';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';


import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule); // 

  app.useGlobalPipes(new ValidationPipe({ 
    whitelist: true, //dto te jegulo nai segulo remove kore dibe
    forbidNonWhitelisted: true, // dto te jei fields nai segulo thakle error throw korbe
    transform: true, // incoming data ke automatically dto te convert kore dibe
  }));

  const config = new DocumentBuilder()
    .setTitle('E-Commerce API')
    .setDescription('E-Commerce Management System API')
    .setVersion('1.0')
    .addBearerAuth() 
    .build();
// ✅ uploads folder ke publicly accessible korrar jonno
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });

app.enableCors({
    origin: 'http://localhost:4000', // NextJS এর URL
    credentials: true,
  });
  
  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();