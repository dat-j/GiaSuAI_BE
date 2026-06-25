import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { SolveRequest } from './entities/solve-request.entity';
import { SolveFeedback } from './entities/solve-feedback.entity';
import { Subscription } from './entities/subscription.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        entities: [User, SolveRequest, SolveFeedback, Subscription],
        synchronize: config.get('NODE_ENV') !== 'production',
      }),
    }),
  ],
})
export class DatabaseModule {}
