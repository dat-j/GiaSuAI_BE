import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, CreateDateColumn, JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('solve_requests')
export class SolveRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  input_type: string;

  @Column()
  problem_hash: string;

  @Column({ nullable: true, type: 'text' })
  problem_text: string;

  @Column()
  mode: string;

  @Column()
  model_used: string;

  @Column({ default: false })
  verified: boolean;

  @Column({ type: 'float', default: 0 })
  confidence: number;

  @Column({ default: 0 })
  latency_ms: number;

  @Column({ default: 0 })
  input_tokens: number;

  @Column({ default: 0 })
  output_tokens: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, default: 0 })
  cost_usd: number;

  @CreateDateColumn()
  created_at: Date;
}
