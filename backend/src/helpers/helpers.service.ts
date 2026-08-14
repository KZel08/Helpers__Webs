import { Injectable, NotFoundException } from '@nestjs/common';
import { HelpersRepository } from './helpers.repository';
import { UploadsService } from '../uploads/uploads.service';
import { UpdateHelperDto } from './dto/update-helper.dto';
import { DocumentType } from '@prisma/client';

@Injectable()
export class HelpersService {
  constructor(
    private readonly helpersRepo: HelpersRepository,
    private readonly uploadsService: UploadsService,
  ) {}

  async findAll(query: { page?: number; limit?: number; categoryId?: string }) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 10, 50);
    return this.helpersRepo.findAll({ page, limit, categoryId: query.categoryId });
  }

  async findById(id: string) {
    const helper = await this.helpersRepo.findById(id);
    if (!helper) throw new NotFoundException('Helper not found');
    return helper;
  }

  async getOrCreateProfile(userId: string) {
    let profile = await this.helpersRepo.findByUserId(userId);
    if (!profile) {
      profile = await this.helpersRepo.createProfile(userId);
    }
    return profile;
  }

  async updateProfile(userId: string, dto: UpdateHelperDto) {
    const profile = await this.helpersRepo.findByUserId(userId);
    if (!profile) throw new NotFoundException('Helper profile not found');
    return this.helpersRepo.updateProfile(profile.id, dto);
  }

  async uploadDocument(
    userId: string,
    file: Express.Multer.File,
    type: DocumentType,
  ) {
    const profile = await this.helpersRepo.findByUserId(userId);

    if (!profile) {
      throw new NotFoundException('Helper profile not found');
    }

    const uploadedFile = await this.uploadsService.uploadFile(
      file,
      'helpers/documents',
    );

    return this.helpersRepo.createDocument({
      helperId: profile.id,
      type,
      fileName: uploadedFile.fileName,
      url: uploadedFile.url,
      mimeType: uploadedFile.mimeType,
      fileSize: uploadedFile.size,
    });
  }
}
