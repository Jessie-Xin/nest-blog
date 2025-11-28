import { Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardStats } from './models/dashboard-stats.model';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

/**
 * 仪表板统计 Resolver
 * 提供系统统计数据查询接口
 * 仅管理员可访问
 */
@UseGuards(GqlAuthGuard, AdminGuard)
@Resolver()
export class DashboardResolver {
  constructor(private dashboardService: DashboardService) {}

  /**
   * 获取完整的仪表板统计数据
   * 仅管理员可访问
   */
  @Query(() => DashboardStats, {
    description: '获取仪表板统计数据（需要管理员权限）',
  })
  async dashboardStats(): Promise<DashboardStats> {
    return this.dashboardService.getDashboardStats();
  }
}
