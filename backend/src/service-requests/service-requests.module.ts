import { Module, forwardRef } from '@nestjs/common';
import { ServiceRequestsService } from './service-requests.service';
import { ServiceRequestsRepository } from './service-requests.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { ServicesModule } from '../services/services.module';

@Module({
  imports: [PrismaModule, forwardRef(() => ServicesModule)],
  providers: [ServiceRequestsService, ServiceRequestsRepository],
  exports: [ServiceRequestsService, ServiceRequestsRepository],
})
export class ServiceRequestsModule {}
