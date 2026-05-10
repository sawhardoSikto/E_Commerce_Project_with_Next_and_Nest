import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';

import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
    constructor(@InjectRepository(User) private userRepository: Repository<User>) {}
    async findByEmail(email: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { email } });
    }

    async findById(id: number): Promise<User | null> {
        return this.userRepository.findOne({ where: { id } });
    }

    async create(name: string, email: string, hashedPassword: string): Promise<User> {
        const user = this.userRepository.create({
             name, 
             email, 
             password :hashedPassword});
        return this.userRepository.save(user);
    }
    // ✅ OTP save করো
  async saveOtp(userId: number, otp: string, expiry: Date): Promise<void> {
    await this.userRepository.update(userId, { otp, otpExpiry: expiry });
  }

  // ✅ OTP clear করো এবং password update করো
  async resetPassword(userId: number, hashedPassword: string): Promise<void> {
    await this.userRepository.update(userId, {
      password: hashedPassword,
      otp: null,
      otpExpiry: null,
    });
  }
}
