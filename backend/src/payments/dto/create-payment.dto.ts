import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';

export class CreatePaymentDto {
  @ApiProperty({ example: 'booking_id' })
  @IsString()
  @IsNotEmpty()
  bookingId: string;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.UPI })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;
}
