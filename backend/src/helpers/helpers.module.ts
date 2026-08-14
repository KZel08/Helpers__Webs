import { Module } from '@nestjs/common';
import { HelpersController } from './helpers.controller';
import { HelpersService } from './helpers.service';
import { HelpersRepository } from './helpers.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [PrismaModule, AuthModule, UploadsModule],
  controllers: [HelpersController],
  providers: [HelpersService, HelpersRepository],
  exports: [HelpersService, HelpersRepository],
})
export class HelpersModule {}
