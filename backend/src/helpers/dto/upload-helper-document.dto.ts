import { ApiProperty } from '@nestjs/swagger';

export class UploadHelperDocumentDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Verification document to upload',
  })
  file: any;
}
