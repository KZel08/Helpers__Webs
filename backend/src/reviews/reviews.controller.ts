import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/services/token.service';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @ApiOperation({ summary: 'Submit a review for a completed booking' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(user.sub, dto);
  }

  @ApiOperation({ summary: 'Get all reviews for a helper' })
  @Get(':helperId')
  async findByHelper(@Param('helperId') helperId: string) {
    return this.reviewsService.findByHelper(helperId);
  }
}
