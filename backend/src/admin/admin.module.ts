import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ServiceRequestsModule } from '../service-requests/service-requests.module';

@Module({
  imports: [PrismaModule, AuthModule, ServiceRequestsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
