import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class VerifyHelperDto {
  @ApiProperty({
    example: true,
    description: 'Whether the helper should be approved',
  })
  @IsBoolean()
  approved: boolean;
}
