import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { register } from 'module';
import { RegisterDto } from './DTOs/register.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './DTOs/login.dto';
import { MailService } from 'src/mail/mail.service';
import { ResetPasswordDto } from 'src/users/DTOs/reset-password.dto';
import { ForgotPasswordDto } from 'src/users/DTOs/forgot-password.dto';

@Injectable()
export class AuthService {
    constructor(private userService: UsersService, private jwtService: JwtService,private mailService: MailService,) {

    }

    async register(dto: RegisterDto) {
        const existingUser = await this.userService.findByEmail(dto.email);
        if (existingUser) {
            throw new Error('Email already in use');
        }
        const hashedPassword = await bcrypt.hash(dto.password, 10);

        const user = await this.userService.create(
            dto.name,
            dto.email,
            hashedPassword,
            dto.phone,
        );
        return {
            message: 'User registered successfully',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        };
        

    }
    async login(dto:LoginDto)
    {
        const user = await this.userService.findByEmail(dto.email);
        if (!user) {
            throw new Error('Invalid email or password');
        }
        const passwordMatch = await bcrypt.compare(dto.password, user.password);
        if (!passwordMatch) {
            throw new Error('Invalid email or password');
        }
        const token = this.jwtService.sign({ id: user.id, email: user.email, role: user.role });
        return {
            message: 'Login successful',
            token,
            data:{
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            }
        };
    }
    
    async getProfile(userId: number) {
        const user = await this.userService.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        return {
            message: 'Profile fetched',
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        };
    }

  async forgotPassword(dto: ForgotPasswordDto) {
    // user ache kina
    const user = await this.userService.findByEmail(dto.email);
    if (!user) throw new NotFoundException('Email not found');
 
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // ৩. OTP   10 minute valid thakbe
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 10);

    // ৪. OTP database e save korlam
    await this.userService.saveOtp(user.id, otp, expiry);

    // ৫. Email e otp pathalam
    await this.mailService.sendOtp(user.email, user.name, otp);

    return { message: 'OTP sent to your email' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    
    const user = await this.userService.findByEmail(dto.email);
    if (!user) throw new NotFoundException('Email not found');

    // otp ache kina check 
    if (!user.otp || !user.otpExpiry) {
      throw new BadRequestException('No OTP requested');
    }

    // opt expired kina check
    if (new Date() > user.otpExpiry) {
      throw new BadRequestException('OTP has expired');
    }

    // otp match kore kina check
    if (user.otp !== dto.otp) {
      throw new BadRequestException('Invalid OTP');
    }

    // new password hash korlam
    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    // password reset korlam + otp clear korlam
    await this.userService.resetPassword(user.id, hashedPassword);

    return { message: 'Password reset successfully' };
  }

}




