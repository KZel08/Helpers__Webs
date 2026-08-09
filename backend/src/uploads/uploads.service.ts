import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  constructor(private readonly configService: ConfigService) {}

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'uploads',
  ): Promise<{ url: string; fileName: string; mimeType: string; size: number }> {
    const cloudinaryUrl = this.configService.get<string>('CLOUDINARY_URL');

    if (cloudinaryUrl) {
      // TODO: real Cloudinary upload using cloudinary SDK
      // const result = await cloudinary.uploader.upload(file.path, { folder });
      // return { url: result.secure_url, ... };
      this.logger.log('[DEV] Cloudinary SDK would be called here');
    } else {
      this.logger.warn('[DEV] CLOUDINARY_URL not set — returning stub URL');
    }

    const stubUrl = `https://storage.example.com/${folder}/${Date.now()}_${file.originalname}`;

    return {
      url: stubUrl,
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }
}
