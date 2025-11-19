import {
  Resolver,
  Query,
  Mutation,
  Args,
  Parent,
  ResolveField,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Media } from './models/media.model';
import { MediaService } from './media.service';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { UserEntity } from '../common/decorators/user.decorator';
import { User } from '../users/models/user.model';
import { MediaIdArgs } from './args/media-id.args';
import { UpdateMediaInput } from './dto/update-media.input';
import { MediaType } from './models/media-type.enum';
import { MediaStats } from './models/media-stats.model';
import { PrismaService } from 'nestjs-prisma';

/**
 * 媒体解析器
 * 处理媒体相关的 GraphQL 查询和变更
 */
@Resolver(() => Media)
export class MediaResolver {
  constructor(
    private mediaService: MediaService,
    private prisma: PrismaService,
  ) {}

  /**
   * 查询所有媒体文件
   */
  @UseGuards(GqlAuthGuard)
  @Query(() => [Media], { description: '查询所有媒体文件' })
  async mediaFiles(
    @UserEntity() user: User,
    @Args('type', { type: () => MediaType, nullable: true })
    type?: MediaType,
    @Args('onlyMine', { type: () => Boolean, nullable: true })
    onlyMine?: boolean,
  ) {
    return this.mediaService.findAll(onlyMine ? user.id : undefined, type);
  }

  /**
   * 根据 ID 查询媒体文件
   */
  @UseGuards(GqlAuthGuard)
  @Query(() => Media, { description: '根据 ID 查询媒体文件' })
  async media(@Args() args: MediaIdArgs) {
    return this.mediaService.findOne(args.mediaId);
  }

  /**
   * 更新媒体信息
   */
  @UseGuards(GqlAuthGuard)
  @Mutation(() => Media, { description: '更新媒体信息' })
  async updateMedia(
    @Args() args: MediaIdArgs,
    @Args('data') data: UpdateMediaInput,
  ) {
    return this.mediaService.update(args.mediaId, data);
  }

  /**
   * 删除媒体文件
   */
  @UseGuards(GqlAuthGuard)
  @Mutation(() => Media, { description: '删除媒体文件' })
  async deleteMedia(@Args() args: MediaIdArgs) {
    return this.mediaService.remove(args.mediaId);
  }

  /**
   * 获取用户的媒体统计
   */
  @UseGuards(GqlAuthGuard)
  @Query(() => MediaStats, { description: '获取用户的媒体统计' })
  async myMediaStats(@UserEntity() user: User) {
    return this.mediaService.getUserMediaStats(user.id);
  }

  /**
   * 解析上传者字段
   */
  @ResolveField('uploader', () => User)
  async uploader(@Parent() media: Media) {
    return this.prisma.media.findUnique({ where: { id: media.id } }).uploader();
  }
}
