import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CartService } from '../cart/cart.service';
import { UpdateOrderStatusDto } from './DTOs/update-order-status.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemsRepo: Repository<OrderItem>,
    private cartService: CartService,
  ) {}

  // Cart থেকে order place করো
  async placeOrder(userId: number) {
    // ১. আমার cart দেখো
    const cart = await this.cartService.getMyCart(userId);

    // ২. cart empty হলে error দাও
    if (cart.count === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // ৩. total price calculate করো
    const totalPrice = parseFloat(cart.total);

    // ৪. Order বানাও
    const order = this.ordersRepo.create({
      userId,
      totalPrice,
    });
    await this.ordersRepo.save(order);

    // ৫. প্রতিটা cart item কে order item বানাও
    for (const item of cart.data) {
      const orderItem = this.orderItemsRepo.create({
        orderId: order.id,
        productId: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
      });
      await this.orderItemsRepo.save(orderItem);

      // ৬. cart থেকে item remove করো
      await this.cartService.removeFromCart(userId, item.id);
    }

    // ৭. order with items return করো
    return this.findOrderById(order.id);
  }

  // একটা order দেখাও
  async findOrderById(orderId: number) {
    const order = await this.ordersRepo.findOne({
      where: { id: orderId },
      relations: ['orderItems', 'orderItems.product'],
    });
    if (!order) throw new NotFoundException(`Order with id ${orderId} not found`);
    return { message: 'Order fetched', data: order };
  }

  // আমার সব orders দেখাও
  async getMyOrders(userId: number) {
    const orders = await this.ordersRepo.find({
      where: { userId },
      relations: ['orderItems', 'orderItems.product'],
      order: { createdAt: 'DESC' },
    });
    return { message: 'Orders fetched', count: orders.length, data: orders };
  }

  // Admin — order status update করো
  async updateStatus(orderId: number, dto: UpdateOrderStatusDto) {
    const order = await this.ordersRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException(`Order with id ${orderId} not found`);
    order.status = dto.status;
    await this.ordersRepo.save(order);
    return { message: 'Order status updated', data: order };
  }
}