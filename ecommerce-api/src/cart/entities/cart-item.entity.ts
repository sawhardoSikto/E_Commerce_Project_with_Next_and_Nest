import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Product } from '../../products/entities/product.entity';

@Entity()
export class CartItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { 
    eager: true,
    onDelete: 'CASCADE' // ✅ User delete হলে CartItem ও delete হবে
  })
  user: User;

  @ManyToOne(() => Product, { 
    eager: true,
    onDelete: 'CASCADE' // ✅ Product delete হলে CartItem ও delete হবে
  })
  product: Product;

  @Column({ default: 1 })
  quantity: number;

  @CreateDateColumn()
  createdAt: Date;
}