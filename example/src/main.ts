import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`
  ==========================================
    SENS AlimTalk Demo Server
  ==========================================

    Server running at: http://localhost:${port}
    Demo page: http://localhost:${port}/

    API Endpoints:
    - POST /alimtalk/send     - 알림톡 발송
    - POST /alimtalk/test     - 테스트 발송 (Mock)

  ==========================================
  `);
}
bootstrap();
