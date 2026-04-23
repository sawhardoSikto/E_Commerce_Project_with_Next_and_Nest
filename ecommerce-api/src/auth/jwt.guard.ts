import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { UnauthorizedException } from '@nestjs/common';

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    
    // এই route এ @IsPublic() আছে কিনা check করো
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    // public route হলে token ছাড়াই ঢুকতে দাও
    if (isPublic) {
      return true;
    }

    // public না হলে JWT check করো
    return super.canActivate(context);
  }

  // token ভুল হলে error দাও
  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw new UnauthorizedException('Invalid or missing token');
    }
    return user;
  }
}