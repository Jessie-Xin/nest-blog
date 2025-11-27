import { GraphQLModule } from '@nestjs/graphql';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'nestjs-prisma';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppResolver } from './app.resolver';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { CategoriesModule } from './categories/categories.module';
import { TagsModule } from './tags/tags.module';
import { MediaModule } from './media/media.module';
import { CommentsModule } from './comments/comments.module';
import { SearchModule } from './search/search.module';
import { RevisionsModule } from './revisions/revisions.module';
import config from './common/configs/config';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GqlConfigService } from './gql-config.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
      // 优先级：.env.local > .env
      // .env.local 用于本地开发，不会被提交到 git
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule.forRoot({
      isGlobal: true,
    }),

    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      useClass: GqlConfigService,
    }),

    AuthModule,
    UsersModule,
    PostsModule,
    CategoriesModule,
    TagsModule,
    MediaModule, // 新增媒体模块
    CommentsModule, // 新增评论模块
    SearchModule, // 新增搜索模块
    RevisionsModule, // 新增版本历史模块
  ],
  controllers: [AppController],
  providers: [AppService, AppResolver],
})
export class AppModule {}
