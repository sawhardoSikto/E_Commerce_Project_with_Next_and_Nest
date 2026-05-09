import { Injectable, NotFoundException } from '@nestjs/common';
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
  ) {}

  // Cart এ product add করো
  async addToCart(userId: number, dto: AddToCartDto) {
    // ১. product আছে কিনা check করো
    const productData = await this.productsService.findOne(dto.productId);
    const product = productData.data;

    // ২. এই user এর cart এ এই product আগে আছে কিনা check করো
    const existing = await this.cartRepo.findOne({
      where: {
        user: { id: userId },
        product: { id: dto.productId },
      },
    });

    // ৩. আগে থেকে থাকলে quantity বাড়াও
    if (existing) {
      existing.quantity += dto.quantity;
      await this.cartRepo.save(existing);
      return { message: 'Cart updated', data: existing };
    }

    // ৪. না থাকলে নতুন item বানাও
    const cartItem = this.cartRepo.create({
      user: { id: userId },
      product: { id: product.id },
      quantity: dto.quantity,
    });
    await this.cartRepo.save(cartItem);
    return { message: 'Product added to cart', data: cartItem };
  }

  // আমার cart দেখাও
  async getMyCart(userId: number) {
    const items = await this.cartRepo.find({
      where: { user: { id: userId } },
    });

    // total price calculate করো
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

  // Cart থেকে item remove করো
  async removeFromCart(userId: number, cartItemId: number) {
    const item = await this.cartRepo.findOne({
      where: { id: cartItemId, user: { id: userId } },
    });
    if (!item) throw new NotFoundException('Cart item not found');
    await this.cartRepo.delete(cartItemId);
    return { message: 'Item removed from cart', id: cartItemId };
  }
}