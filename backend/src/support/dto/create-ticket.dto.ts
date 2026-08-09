import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TicketPriority } from '@prisma/client';

export class CreateTicketDto {
  @ApiProperty({ example: 'Payment not received' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: 'I completed booking b_001 but payment is still pending...' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  message: string;

  @ApiPropertyOptional({ enum: TicketPriority, default: TicketPriority.MEDIUM })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;
}
