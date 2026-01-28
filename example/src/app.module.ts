import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { SensAlimtalkModule } from '../../src';
import { AlimtalkController } from './alimtalk.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
    SensAlimtalkModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        accessKey: config.get('NCLOUD_ACCESS_KEY') || 'demo_access_key',
        secretKey: config.get('NCLOUD_SECRET_KEY') || 'demo_secret_key',
        serviceId: config.get('SENS_SERVICE_ID') || 'demo_service_id',
        plusFriendId: config.get('KAKAO_PLUS_FRIEND_ID') || '@demo',
        useSmsFailover: true,
      }),
    }),
  ],
  controllers: [AlimtalkController],
})
export class AppModule {}
