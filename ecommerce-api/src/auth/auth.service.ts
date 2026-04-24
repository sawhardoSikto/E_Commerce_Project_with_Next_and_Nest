import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { register } from 'module';
import { RegisterDto } from './DTOs/register.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './DTOs/login.dto';

@Injectable()
export class AuthService {
    constructor(private userService: UsersService, private jwtService: JwtService) {

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
        const token = this.jwtService.sign({ id: user.id, email: user.email });
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

}




