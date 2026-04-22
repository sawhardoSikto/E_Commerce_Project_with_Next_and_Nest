import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })  // একই email দুইবার register করা যাবে না
  email: string;

  @Column()
  password: string;  // bcrypt দিয়ে hashed হয়ে save হবে

  @Column({ default: 'customer' })
  role: string;  // 'customer' অথবা 'admin'

  @CreateDateColumn()
  createdAt: Date;
}