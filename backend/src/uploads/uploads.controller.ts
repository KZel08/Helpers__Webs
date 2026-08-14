import {
  Controller,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadFileDto } from './dto/upload-file.dto';

@ApiTags('Uploads')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @ApiOperation({ summary: 'Upload a file (image or document)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File upload',
    type: UploadFileDto,
  })
  @ApiQuery({
    name: 'folder',
    required: false,
    type: String,
    example: 'helpers/documents',
    description: 'Cloudinary folder',
  })
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder?: string,
  ) {
    return this.uploadsService.uploadFile(
      file,
      folder ?? 'uploads',
    );
  }
}
