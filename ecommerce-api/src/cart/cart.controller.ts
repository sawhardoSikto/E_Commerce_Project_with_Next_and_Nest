import { Controller, Get, Post, Delete, Body, Param, Request, ParseIntPipe, Patch } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './DTOs/add-to-cart.dto';

@Controller('cart')
export class CartController {
  constructor(private cartService: CartService) {}

  
  @Post()
  addToCart(@Body() dto: AddToCartDto, @Request() req) {
    return this.cartService.addToCart(req.user.id, dto);
  }


  @Get('my')
  getMyCart(@Request() req) {
    return this.cartService.getMyCart(req.user.id);
  }


  @Delete(':id')
  removeFromCart(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.cartService.removeFromCart(req.user.id, id);
  }
  @Patch(':id')
updateQuantity(
  @Param('id', ParseIntPipe) id: number,
  @Body() body: { quantity: number },
  @Request() req,
) {
  return this.cartService.updateQuantity(req.user.id, id, body.quantity);
}
}