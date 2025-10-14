import { supabaseAdmin } from './supabase'
import { AggregateLoginProfile } from './aggregate-auth'

export interface UserProfile {
  id: string
  providerUserId: string
  provider: string
  username: string
  displayName: string
  email: string
  avatarUrl: string
  trustLevel: number
  isActive: boolean
  isSilenced: boolean
  lastLoginAt: string
  loginCount: number
  createdAt: string
  updatedAt: string
}

export class UserManager {
  private supabase: any = supabaseAdmin

  // 创建或更新用户信息（OAuth登录时调用）
  async upsertUser(profile: AggregateLoginProfile): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    try {
      const providerUserId = `${profile.type}_${profile.social_uid}`
      const now = new Date().toISOString()

      // 检查用户是否已存在
      const { data: existingUser, error: fetchError } = await this.supabase
        .from('users')
        .select('*')
        .eq('provider_user_id', providerUserId)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        return { success: false, error: fetchError.message }
      }

      const userData = {
        provider_user_id: providerUserId,
        provider: profile.type,
        username: profile.nickname || `${profile.type}_${profile.social_uid}`,
        display_name: profile.nickname || `${profile.type}_${profile.social_uid}`,
        email: null,
        avatar_url: profile.faceimg,
        trust_level: 1, // 默认信任等级为1
        is_active: true,
        is_silenced: false,
        last_login_at: now,
        login_count: existingUser ? (existingUser.login_count || 0) + 1 : 1,
        updated_at: now
      }

      let result: any
      if (existingUser) {
        // 更新现有用户
        result = await this.supabase
          .from('users')
          .update(userData)
          .eq('id', existingUser.id)
          .select()
          .single()
      } else {
        // 创建新用户
        result = await this.supabase
          .from('users')
          .insert({
            ...userData,
            created_at: now
          })
          .select()
          .single()
      }

      if (result.error) {
        return { success: false, error: result.error.message }
      }

      const user = this.formatUserProfile(result.data)
      return { success: true, user }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // 根据ID获取用户信息
  async getUserById(userId: string): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      const user = this.formatUserProfile(data)
      return { success: true, user }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // 根据提供商用户ID获取用户信息
  async getUserByProviderUserId(providerUserId: string): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('provider_user_id', providerUserId)
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      const user = this.formatUserProfile(data)
      return { success: true, user }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // 获取活跃用户统计
  async getActiveUsersStats(): Promise<{
    success: boolean;
    stats?: {
      totalUsers: number;
      activeUsers: number;
      newUsersToday: number;
      topContributors: any[];
    };
    error?: string
  }> {
    try {
      const today = new Date().toISOString().split('T')[0]

      // 总用户数
      const { count: totalUsers, error: countError1 } = await this.supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

      if (countError1) {
        return { success: false, error: countError1.message }
      }

      // 活跃用户数
      const { count: activeUsers, error: countError2 } = await this.supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      if (countError2) {
        return { success: false, error: countError2.message }
      }

      // 今日新用户
      const { count: newUsersToday, error: countError3 } = await this.supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today)

      if (countError3) {
        return { success: false, error: countError3.message }
      }

      // 顶级贡献者（按共享Key数量）
      const { data: topContributors, error: selectError } = await this.supabase
        .from('users')
        .select(`
          id,
          username,
          display_name,
          avatar_url,
          trust_level,
          shared_keys!inner(id)
        `)
        .eq('is_active', true)
        .limit(10)

      if (selectError) {
        return { success: false, error: selectError.message }
      }

      return {
        success: true,
        stats: {
          totalUsers: totalUsers || 0,
          activeUsers: activeUsers || 0,
          newUsersToday: newUsersToday || 0,
          topContributors: topContributors || []
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // 更新用户最后登录时间
  async updateLastLogin(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('users')
        .update({
          last_login_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // 格式化用户数据
  private formatUserProfile(data: any): UserProfile {
    return {
      id: data.id,
      providerUserId: data.provider_user_id,
      provider: data.provider,
      username: data.username,
      displayName: data.display_name || data.username,
      email: data.email,
      avatarUrl: data.avatar_url,
      trustLevel: data.trust_level || 0,
      isActive: data.is_active,
      isSilenced: data.is_silenced,
      lastLoginAt: data.last_login_at,
      loginCount: data.login_count || 0,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }

  // 检查用户权限（基于信任等级）
  canUseSharedService(trustLevel: number): boolean {
    return trustLevel >= 1 && trustLevel <= 4 // 只有LV1-4可以使用共享服务
  }

  canShareKeys(trustLevel: number): boolean {
    return this.canUseSharedService(trustLevel) // 必须先能使用共享服务
  }

  canManageKeys(trustLevel: number): boolean {
    return this.canUseSharedService(trustLevel) // 必须先能使用共享服务
  }

  isVipUser(trustLevel: number): boolean {
    return trustLevel >= 3 && trustLevel <= 4 // VIP用户也必须在有效等级范围内
  }
}