import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { User } from '../database/entities/user.entity';

@Injectable()
export class QuotaService {
  private redis: Redis;

  constructor(
    private config: ConfigService,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {
    this.redis = new Redis({
      host: config.get('REDIS_HOST', 'localhost'),
      port: config.get<number>('REDIS_PORT', 6379),
    });
  }

  private getVnDateKey(): string {
    const now = new Date();
    const vnOffset = 7 * 60;
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const vnDate = new Date(utc + vnOffset * 60000);
    const y = vnDate.getFullYear();
    const m = String(vnDate.getMonth() + 1).padStart(2, '0');
    const d = String(vnDate.getDate()).padStart(2, '0');
    return `${y}${m}${d}`;
  }

  private getMinuteKey(): string {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    return `${hh}${mm}`;
  }

  async checkIpLimit(ip: string): Promise<void> {
    const dateKey = this.getVnDateKey();
    const minuteKey = this.getMinuteKey();

    const [minuteCount, abuseCount] = await Promise.all([
      this.redis.get(`ip_rate:${ip}:${minuteKey}`),
      this.redis.get(`abuse:${ip}:${dateKey}`),
    ]);

    if (parseInt(minuteCount ?? '0') >= 10) {
      throw { code: 'RATE_LIMITED', status: 429 };
    }
    if (parseInt(abuseCount ?? '0') >= 100) {
      throw { code: 'RATE_LIMITED', status: 429 };
    }
  }

  async checkUserQuota(uid: string, isPremium: boolean): Promise<void> {
    const dateKey = this.getVnDateKey();
    const limit = isPremium ? 50 : 5;
    const used = parseInt((await this.redis.get(`quota:${uid}:${dateKey}`)) ?? '0');

    if (used >= limit) {
      throw { code: 'QUOTA_EXCEEDED', status: 429 };
    }
  }

  async incrementCounters(uid: string, ip: string): Promise<void> {
    const dateKey = this.getVnDateKey();
    const minuteKey = this.getMinuteKey();

    const pipeline = this.redis.pipeline();

    const quotaKey = `quota:${uid}:${dateKey}`;
    pipeline.incr(quotaKey);
    pipeline.expireat(quotaKey, this.getMidnightTimestamp());

    const ipRateKey = `ip_rate:${ip}:${minuteKey}`;
    pipeline.incr(ipRateKey);
    pipeline.expire(ipRateKey, 60);

    const abuseKey = `abuse:${ip}:${dateKey}`;
    pipeline.incr(abuseKey);
    pipeline.expireat(abuseKey, this.getMidnightTimestamp());

    await pipeline.exec();
  }

  async getRemaining(uid: string, isPremium: boolean): Promise<number> {
    const dateKey = this.getVnDateKey();
    const limit = isPremium ? 50 : 5;
    const used = parseInt((await this.redis.get(`quota:${uid}:${dateKey}`)) ?? '0');
    return Math.max(0, limit - used);
  }

  async findOrCreateUser(uid: string): Promise<User> {
    let user = await this.userRepo.findOne({ where: { firebase_uid: uid } });
    if (!user) {
      user = this.userRepo.create({ firebase_uid: uid, tier: 'free' });
      await this.userRepo.save(user);
    }
    return user;
  }

  private getMidnightTimestamp(): number {
    const vnOffset = 7 * 60;
    const utc = Date.now() + new Date().getTimezoneOffset() * 60000;
    const vnNow = new Date(utc + vnOffset * 60000);
    const midnight = new Date(vnNow);
    midnight.setHours(24, 0, 0, 0);
    return Math.floor((midnight.getTime() - vnOffset * 60000) / 1000);
  }

  getRedis(): Redis {
    return this.redis;
  }
}
