import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  constructor(private readonly configService: ConfigService) {}

  async uploadFile(
    file: Express.Multer.File,
    folder = 'uploads',
  ): Promise<{
    url: string;
    fileName: string;
    mimeType: string;
    size: number;
  }> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const cloudinaryUrl =
      this.configService.get<string>('CLOUDINARY_URL');

    if (!cloudinaryUrl) {
      throw new ServiceUnavailableException(
        'File storage is not configured',
      );
    }

    const parsedUrl = new URL(cloudinaryUrl);

    cloudinary.config({
      cloud_name: parsedUrl.hostname,
      api_key: parsedUrl.username,
      api_secret: decodeURIComponent(parsedUrl.password),
      secure: true,
    });

    try {
      const result = await new Promise<UploadApiResponse>(
        (resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder,
              resource_type: 'raw',
            },
            (error, result) => {
              if (error) {
                reject(error);
                return;
              }

              if (!result) {
                reject(
                  new Error('Cloudinary returned no upload result'),
                );
                return;
              }

              resolve(result);
            },
          );

          uploadStream.end(file.buffer);
        },
      );

      this.logger.log(
        `File uploaded successfully: ${result.public_id}`,
      );

      return {
        url: result.secure_url,
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      };
    } catch (error) {
      this.logger.error(
        'Cloudinary upload failed',
        error instanceof Error ? error.stack : String(error),
      );

      throw new ServiceUnavailableException(
        'File upload failed',
      );
    }
  }
}
