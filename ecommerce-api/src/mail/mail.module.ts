import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';

@Module({
  providers: [MailService],
  controllers: [MailController],
  exports: [MailService], // ✅ export করো যাতে অন্য module এ use করতে পারি
})
export class MailModule {}
