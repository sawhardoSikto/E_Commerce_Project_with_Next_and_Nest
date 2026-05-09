import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderItem } from './entities/order-item.entity';
import { Order } from './entities/order.entity';
import { TypeOrmModule } from '@nestjs/typeorm'; // ✅
import { CartModule } from '../cart/cart.module'; // ✅
import { UsersModule } from '../users/users.module'; // ✅
import { MailModule } from '../mail/mail.module'; // ✅

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem]),
    CartModule,
    MailModule,
    UsersModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}