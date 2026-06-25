import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, CreateDateColumn, JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ default: 'revenuecat' })
  provider: string;

  @Column()
  status: string;

  @Column({ nullable: true })
  premium_until: Date;

  @CreateDateColumn()
  created_at: Date;
}
