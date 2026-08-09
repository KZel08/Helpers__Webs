import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyPaymentDto {
  @ApiProperty({ description: 'Razorpay order ID' })
  @IsString()
  @IsNotEmpty()
  razorpayOrderId: string;

  @ApiProperty({ description: 'Razorpay payment ID' })
  @IsString()
  @IsNotEmpty()
  razorpayPaymentId: string;

  @ApiProperty({ description: 'Razorpay signature' })
  @IsString()
  @IsNotEmpty()
  razorpaySignature: string;
}
