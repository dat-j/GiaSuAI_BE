import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { DatabaseModule } from './database/database.module';
import { SolveModule } from './solve/solve.module';
import { QuotaModule } from './quota/quota.module';
import { AuthModule } from './auth/auth.module';
import { ModelsModule } from './models/models.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    {
      module: class FirebaseInitModule {},
      providers: [
        {
          provide: 'FIREBASE_ADMIN_INIT',
          useFactory: (config: ConfigService) => {
            if (!admin.apps.length) {
              admin.initializeApp({
                credential: admin.credential.cert({
                  projectId: config.get('FIREBASE_PROJECT_ID'),
                  clientEmail: config.get('FIREBASE_CLIENT_EMAIL'),
                  privateKey: config
                    .get<string>('FIREBASE_PRIVATE_KEY')
                    ?.replace(/\\n/g, '\n'),
                }),
              });
            }
            return admin;
          },
          inject: [ConfigService],
        },
      ],
      exports: ['FIREBASE_ADMIN_INIT'],
      global: true,
    } as any,
    DatabaseModule,
    AuthModule,
    QuotaModule,
    ModelsModule,
    SolveModule,
  ],
})
export class AppModule {}
