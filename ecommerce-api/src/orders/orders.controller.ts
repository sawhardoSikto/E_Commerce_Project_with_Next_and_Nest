// orders.controller.ts

import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Request,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';

import { OrdersService } from './orders.service';
import { UpdateOrderStatusDto } from './DTOs/update-order-status.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('orders')
@UseGuards(RolesGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  // cart theke order place korar jonno
  @Post()
  placeOrder(@Request() req) {
    return this.ordersService.placeOrder(req.user.id);
  }

  // admin — sob order dekhbe
  @Get()
  @Roles('admin')
  findAllOrders() {
    return this.ordersService.findAllOrders();
  }

  // customer nijer orders dekhbe
  @Get('my')
  getMyOrders(@Request() req) {
    return this.ordersService.getMyOrders(req.user.id);
  }

  // single order details
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOrderById(id);
  }

  // admin — order status update
  @Patch(':id/status')
  @Roles('admin')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto);
  }
}