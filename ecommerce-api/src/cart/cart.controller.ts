import { Controller, Get, Post, Delete, Body, Param, Request, ParseIntPipe } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './DTOs/add-to-cart.dto';

@Controller('cart')
export class CartController {
  constructor(private cartService: CartService) {}

  // cart এ add করো — token লাগবে
  @Post()
  addToCart(@Body() dto: AddToCartDto, @Request() req) {
    return this.cartService.addToCart(req.user.id, dto);
  }

  // আমার cart দেখাও — token লাগবে
  @Get('my')
  getMyCart(@Request() req) {
    return this.cartService.getMyCart(req.user.id);
  }

  // cart থেকে remove করো — token লাগবে
  @Delete(':id')
  removeFromCart(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.cartService.removeFromCart(req.user.id, id);
  }
}