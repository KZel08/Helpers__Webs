import { Module } from '@nestjs/common';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { ServicesRepository } from './services.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { HelpersModule } from '../helpers/helpers.module';

@Module({
  imports: [PrismaModule, AuthModule, HelpersModule],
  controllers: [ServicesController],
  providers: [ServicesService, ServicesRepository],
  exports: [ServicesService, ServicesRepository],
})
export class ServicesModule {}
