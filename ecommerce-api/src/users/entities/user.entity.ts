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

  @Column({ nullable: true })
  phone: string;


  @Column({ nullable: true, type: 'varchar' }) // ✅ type দাও
  otp: string | null;

  @Column({ nullable: true, type: 'timestamp' }) // ✅ type দাও
  otpExpiry: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}