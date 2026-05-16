import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartItem } from './entities/cart-item.entity';
import { AddToCartDto } from './DTOs/add-to-cart.dto';
import { ProductsService } from '../products/products.service';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartItem)
    private cartRepo: Repository<CartItem>,
    private productsService: ProductsService,
  ) { }

  // Cart e product add 
  async addToCart(userId: number, dto: AddToCartDto) {
    // product ache kina check 
    const productData = await this.productsService.findOne(dto.productId);
    const product = productData.data;

    // ei user er cart e ei product ache kina check 
    const existing = await this.cartRepo.findOne({
      where: {
        user: { id: userId },
        product: { id: dto.productId },
      },
    });

    // jodi thake tahole quantity update hobe
    if (existing) {
      existing.quantity += dto.quantity;
      await this.cartRepo.save(existing);
      return { message: 'Cart updated', data: existing };
    }

    // na thekle notun cart item create hobe
    const cartItem = this.cartRepo.create({
      user: { id: userId },
      product: { id: product.id },
      quantity: dto.quantity,
    });
    await this.cartRepo.save(cartItem);
    return { message: 'Product added to cart', data: cartItem };
  }


  async getMyCart(userId: number) {
    const items = await this.cartRepo.find({
      where: { user: { id: userId } },
    });

    // total price calculate 
    const total = items.reduce((sum, item) => {
      return sum + Number(item.product.price) * item.quantity;
    }, 0);

    return {
      message: 'Cart fetched',
      count: items.length,
      total: total.toFixed(2),
      data: items,
    };
  }

  // Cart theke product remove
  async removeFromCart(userId: number, cartItemId: number) {
    const item = await this.cartRepo.findOne({
      where: { id: cartItemId, user: { id: userId } },
    });
    if (!item) throw new NotFoundException('Cart item not found');
    await this.cartRepo.delete(cartItemId);
    return { message: 'Item removed from cart', id: cartItemId };
  }

  async updateQuantity(userId: number, cartItemId: number, quantity: number) {
    const item = await this.cartRepo.findOne({
      where: {
        id: cartItemId,
        user: {
          id: userId,
        },
      },
    });
    if (!item) throw new NotFoundException('Cart item not found');
    if (quantity < 1) throw new BadRequestException('Quantity must be at least 1');

    await this.cartRepo
      .createQueryBuilder()
      .update(CartItem)
      .set({ quantity })
      .where('id = :id', { id: cartItemId })
      .execute();

    return { message: 'Quantity updated', id: cartItemId, quantity };
  }
}