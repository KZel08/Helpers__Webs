import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { envValidationSchema } from './config/env.validation';

// Domain modules
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { HelpersModule } from './helpers/helpers.module';
import { CategoriesModule } from './categories/categories.module';
import { ServicesModule } from './services/services.module';
import { BookingsModule } from './bookings/bookings.module';
import { PaymentsModule } from './payments/payments.module';
import { ReviewsModule } from './reviews/reviews.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SupportModule } from './support/support.module';
import { UploadsModule } from './uploads/uploads.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      validationSchema: envValidationSchema,
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute in ms
        limit: 100,
      },
    ]),

    // Database
    PrismaModule,

    // Domain modules
    AuthModule,
    UsersModule,
    HelpersModule,
    CategoriesModule,
    ServicesModule,
    BookingsModule,
    PaymentsModule,
    ReviewsModule,
    NotificationsModule,
    SupportModule,
    UploadsModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
