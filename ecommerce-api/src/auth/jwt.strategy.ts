import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      // Header থেকে "Bearer eyJ..." বের করে
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // secret দিয়ে token verify করে
      secretOrKey: configService.get('JWT_SECRET') as string,
    });
  }

  // token valid হলে এই function call হয়
  // যা return করবে সেটাই req.user হয়ে যাবে
 async validate(payload: any) {
  console.log('JWT Payload:', payload);
  return { 
    id: payload.id,       // ✅ sub না, id দাও
    email: payload.email, 
    role: payload.role 
  };
}
}