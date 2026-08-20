import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({ example: 'service_id' })
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @ApiProperty({ example: 'address_id' })
  @IsString()
  @IsNotEmpty()
  addressId: string;

  @ApiProperty({ example: '2026-08-01T10:00:00.000Z' })
  @IsDateString()
  bookingDate: string;

  @ApiPropertyOptional({ example: '2026-08-01T10:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({ example: 'Please bring your own cleaning supplies' })
  @IsOptional()
  @IsString()
  notes?: string;
}
