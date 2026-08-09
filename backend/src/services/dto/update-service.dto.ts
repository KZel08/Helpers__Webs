import { PartialType } from '@nestjs/swagger';
import { CreateServiceDto } from './create-service.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateServiceDto extends PartialType(CreateServiceDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
