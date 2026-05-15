import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './DTOs/create-product.dto';
import { UpdateProductDto } from './DTOs/update-product.dto';
import { PartialUpdateProductDto } from './DTOs/partial-update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepo: Repository<Product>,
  ) {}

  async create(dto: CreateProductDto) {
    const product = this.productsRepo.create(dto);
    await this.productsRepo.save(product);
    return { message: 'Product created', data: product };
  }

  async findAll() {
    const products = await this.productsRepo.find({
      order: { createdAt: 'DESC' },
    });
    return { message: 'All products fetched', count: products.length, data: products };
  }

  async findOne(id: number) {
    const product = await this.productsRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException(`Product with id ${id} not found`);
    return { message: 'Product fetched', data: product };
  }

  async update(id: number, dto: PartialUpdateProductDto) {
    await this.findOne(id);
    await this.productsRepo.update(id, dto);
    return this.findOne(id);
  }

  async replace(id: number, dto: UpdateProductDto) {
    await this.findOne(id);
    await this.productsRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.productsRepo.delete(id);
    return { message: 'Product deleted', id };
  }

  async findByCategory(category: string) {
    const products = await this.productsRepo.find({ where: { category } });
    return { message: 'Products by category', count: products.length, data: products };
  }

  async search(keyword: string) {
    const products = await this.productsRepo.find({
      where: { name: ILike(`%${keyword}%`) },
    });
    return { message: 'Search results', count: products.length, data: products };
  }

  async updateImage(id: number, imageUrl: string) {
  await this.findOne(id); // product ache kina check
  await this.productsRepo.update(id, { imageUrl });
  return this.findOne(id);
}
}