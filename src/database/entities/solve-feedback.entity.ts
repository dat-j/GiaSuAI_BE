import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, CreateDateColumn, JoinColumn,
} from 'typeorm';
import { SolveRequest } from './solve-request.entity';
import { User } from './user.entity';

@Entity('solve_feedback')
export class SolveFeedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => SolveRequest)
  @JoinColumn({ name: 'solve_request_id' })
  solve_request: SolveRequest;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  type: string;

  @Column({ nullable: true, type: 'text' })
  note: string;

  @CreateDateColumn()
  created_at: Date;
}
