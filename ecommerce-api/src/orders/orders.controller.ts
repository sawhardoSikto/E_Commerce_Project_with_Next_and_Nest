import { Controller, Get, Post, Patch, Param, Body, Request, ParseIntPipe } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { UpdateOrderStatusDto } from './DTOs/update-order-status.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UseGuards } from '@nestjs/common';

@Controller('orders')
@UseGuards(RolesGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  // cart থেকে order place করো
  @Post()
  placeOrder(@Request() req) {
    return this.ordersService.placeOrder(req.user.id);
  }

  // আমার orders দেখাও
  @Get('my')
  getMyOrders(@Request() req) {
    return this.ordersService.getMyOrders(req.user.id);
  }

  // admin — order status update করো
  @Patch(':id/status')
  @Roles('admin')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto);
  }
}