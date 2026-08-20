import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ServiceRequestsModule } from '../service-requests/service-requests.module';
import { CategoriesModule } from '../categories/categories.module';
import { ServicesModule } from '../services/services.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ServiceRequestsModule,
    CategoriesModule,
    ServicesModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
