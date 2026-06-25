import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  firebase_uid: string;

  @Column({ default: 'free' })
  tier: 'free' | 'premium';

  @CreateDateColumn()
  created_at: Date;
}
