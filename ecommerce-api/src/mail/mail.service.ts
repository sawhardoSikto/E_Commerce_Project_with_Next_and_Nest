import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendOrderConfirmation(
    email: string,
    name: string,
    orderId: number,
    totalPrice: number,
    items: any[],
  ) {
    // items list বানাও
    const itemList = items
      .map(item => `- ${item.product.name} x${item.quantity} = $${item.price}`)
      .join('\n');

    await this.mailerService.sendMail({
      to: email,
      subject: `Order Confirmation #${orderId}`,
      text: `
Hi ${name}!

Your order has been placed successfully! 🎉

Order ID: #${orderId}
Status: Pending

Items:
${itemList}

Total: $${totalPrice}

Thank you for shopping with us!
      `,
    });
  }

  async sendOrderStatusUpdate(
    email: string,
    name: string,
    orderId: number,
    status: string,
  ) {
    await this.mailerService.sendMail({
      to: email,
      subject: `Order #${orderId} Status Update`,
      text: `
Hi ${name}!

Your order #${orderId} status has been updated.

New Status: ${status.toUpperCase()}

Thank you for shopping with us!
      `,
    });
  }
  async sendOtp(email: string, name: string, otp: string) {
  await this.mailerService.sendMail({
    to: email,
    subject: 'Password Reset OTP',
    text: `
Hi ${name}!

Your OTP for password reset is: ${otp}

This OTP will expire in 10 minutes.

If you did not request this, please ignore this email.
    `,
  });
}
}