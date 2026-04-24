import { Body, Controller, Get, Post, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './DTOs/register.dto';
import { IsPublic } from './public.decorator';
import { LoginDto,  } from './DTOs/login.dto';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {

    }
    @IsPublic()
    @Post('register')
    async register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }
    @IsPublic()
    @Post('login')
    async login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }
    @Get('profile')
    async getProfile(@Request() req) {
        return this.authService.getProfile(req.user.id);
    }}
