// orders.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';

import { CartService } from '../cart/cart.service';
import { UpdateOrderStatusDto } from './DTOs/update-order-status.dto';

import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepo: Repository<Order>,

    @InjectRepository(OrderItem)
    private orderItemsRepo: Repository<OrderItem>,
    @InjectRepository(Product)
    private productsRepo: Repository<Product>,

    private cartService: CartService,

    private mailService: MailService,

    private usersService: UsersService,
  ) {}

  // order place
  // order place
async placeOrder(userId: number) {

  // cart fetch
  const cart = await this.cartService.getMyCart(userId);

  // empty cart check
  if (cart.count === 0) {
    throw new BadRequestException('Cart is empty');
  }

  // total price
  const totalPrice = parseFloat(cart.total);

  // create order
  const order = this.ordersRepo.create({
    userId,
    totalPrice,
  });

  await this.ordersRepo.save(order);

  // create order items + stock reduce
  for (const item of cart.data) {

    // product find
    const product = await this.productsRepo.findOne({
      where: {
        id: item.product.id,
      },
    });

    // product check
    if (!product) {
      throw new NotFoundException(
        `Product with id ${item.product.id} not found`,
      );
    }

    // stock check
    if (product.stock < item.quantity) {
      throw new BadRequestException(
        `${product.name} is out of stock`,
      );
    }

    // create order item
    const orderItem = this.orderItemsRepo.create({
      orderId: order.id,
      productId: item.product.id,
      quantity: item.quantity,
      price: item.product.price,
    });

    await this.orderItemsRepo.save(orderItem);

    // reduce stock
    product.stock -= item.quantity;

    // save updated product
    await this.productsRepo.save(product);

    // remove cart item
    await this.cartService.removeFromCart(
      userId,
      item.id,
    );
  }

  // user fetch
  const user = await this.usersService.findById(userId);

  if (!user) {
    throw new NotFoundException('User not found');
  }

  // full order data
  const orderData = await this.findOrderById(order.id);

  // send confirmation email
  await this.mailService.sendOrderConfirmation(
    user.email,
    user.name,
    order.id,
    totalPrice,
    orderData.data.orderItems,
  );

  return {
    message: 'Order placed successfully',
    data: orderData.data,
  };
}

  // admin — all orders
  async findAllOrders() {
    const orders = await this.ordersRepo.find({
      relations: [
        'orderItems',
        'orderItems.product',
      ],
      order: {
        createdAt: 'DESC',
      },
    });

    return {
      message: 'All orders fetched',
      count: orders.length,
      data: orders,
    };
  }

  // single order
  async findOrderById(orderId: number) {
    const order = await this.ordersRepo.findOne({
      where: {
        id: orderId,
      },
      relations: [
        'orderItems',
        'orderItems.product',
      ],
    });

    if (!order) {
      throw new NotFoundException(
        `Order with id ${orderId} not found`,
      );
    }

    return {
      message: 'Order fetched',
      data: order,
    };
  }

  // customer orders
  async getMyOrders(userId: number) {
    const orders = await this.ordersRepo.find({
      where: {
        userId,
      },
      relations: [
        'orderItems',
        'orderItems.product',
      ],
      order: {
        createdAt: 'DESC',
      },
    });

    return {
      message: 'Orders fetched',
      count: orders.length,
      data: orders,
    };
  }

  // admin status update
  async updateStatus(
    orderId: number,
    dto: UpdateOrderStatusDto,
  ) {
    const order = await this.ordersRepo.findOne({
      where: {
        id: orderId,
      },
      relations: ['user'],
    });

    if (!order) {
      throw new NotFoundException(
        `Order with id ${orderId} not found`,
      );
    }

    order.status = dto.status;

    await this.ordersRepo.save(order);

    // send email
    await this.mailService.sendOrderStatusUpdate(
      order.user.email,
      order.user.name,
      orderId,
      dto.status,
    );

    return {
      message: 'Order status updated',
      data: order,
    };
  }
}