// 聚合登录 Provider 适配器
// 支持 QQ、支付宝、抖音三种登录方式

export interface AggregateLoginProfile {
  social_uid: string
  nickname: string
  faceimg: string
  gender: string
  location: string
  type: 'qq' | 'alipay' | 'douyin'
}

export interface AggregateLoginConfig {
  appid: string
  appkey: string
  redirectUri: string
}

// 聚合登录 Provider 配置
class AggregateLoginProvider {
  private config: AggregateLoginConfig

  constructor(config: AggregateLoginConfig) {
    this.config = config
  }

  // 获取登录授权 URL
  getAuthorizationUrl(type: 'qq' | 'alipay' | 'douyin'): string {
    const params = new URLSearchParams({
      act: 'login',
      appid: this.config.appid,
      appkey: this.config.appkey,
      type,
      redirect_uri: this.config.redirectUri
    })

    return `https://lxsd.top/connect.php?${params.toString()}`
  }

  // 处理回调，获取用户信息
  async handleCallback(type: 'qq' | 'alipay' | 'douyin', code: string): Promise<AggregateLoginProfile> {
    const params = new URLSearchParams({
      act: 'callback',
      appid: this.config.appid,
      appkey: this.config.appkey,
      type,
      code
    })

    const response = await fetch(`https://lxsd.top/connect.php?${params.toString()}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch user info: ${response.status}`)
    }

    const data = await response.json()

    // 聚合登录API返回格式：{code: 0, msg: "succ", data: {...}}
    if (data.code !== 0) {
      throw new Error(`API error: ${data.msg || 'Unknown error'}`)
    }

    return {
      ...data.data,
      type
    }
  }

  // 从回调 URL 中解析参数
  parseCallbackUrl(url: string): { type: 'qq' | 'alipay' | 'douyin'; code: string } | null {
    try {
      const urlObj = new URL(url)
      const type = urlObj.searchParams.get('type') as 'qq' | 'alipay' | 'douyin'
      const code = urlObj.searchParams.get('code')

      if (!type || !code) {
        return null
      }

      if (!['qq', 'alipay', 'douyin'].includes(type)) {
        return null
      }

      return { type, code }
    } catch {
      return null
    }
  }
}

// NextAuth Provider 工厂函数
export function createAggregateLoginProvider(config: AggregateLoginConfig) {
  return {
    id: "aggregate-login",
    name: "Aggregate Login",
    type: "oauth" as const,

    authorization: {
      url: async () => {
        // 这个方法在 NextAuth 中不会被直接调用
        // 我们需要在客户端手动处理授权流程
        return "/api/auth/aggregate-login/authorize"
      },
      params: {}
    },

    token: {
      url: "/api/auth/aggregate-login/token",
      async request({ params }: any) {
        // 处理 token 交换
        const { code, type } = params

        const provider = new AggregateLoginProvider(config)
        const profile = await provider.handleCallback(type, code)

        return {
          tokens: {
            access_token: `${type}_${profile.social_uid}`,
            token_type: "bearer",
            expires_in: 3600
          },
          profile
        }
      }
    },

    userinfo: {
      url: "/api/auth/aggregate-login/userinfo",
      async request({ tokens }: any) {
        // 从 token 中提取用户信息
        const [type, socialUid] = tokens.access_token.split('_')

        return {
          sub: socialUid,
          name: `${type}_${socialUid}`, // 临时名称，将在 profile 中被覆盖
          email: null, // 聚合登录不提供邮箱
          image: null, // 将在 profile 中被覆盖
          type,
          social_uid: socialUid
        }
      }
    },

    profile(profile: AggregateLoginProfile) {
      return {
        id: `${profile.type}_${profile.social_uid}`,
        name: profile.nickname,
        email: null, // 聚合登录通常不提供邮箱
        image: profile.faceimg,
        type: profile.type,
        social_uid: profile.social_uid
      }
    },

    options: config
  }
}

// 客户端使用的登录函数
export async function initiateAggregateLogin(type: 'qq' | 'alipay' | 'douyin') {
  try {
    // 调用后端API获取授权URL
    const response = await fetch(`/api/auth/aggregate-login/authorize?type=${encodeURIComponent(type)}`)

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to get authorization URL')
    }

    const data = await response.json()

    if (!data.success || !data.url) {
      throw new Error(data.message || 'No authorization URL returned')
    }

    // 重定向到授权页面
    window.location.href = data.url
  } catch (error) {
    console.error('Failed to initiate aggregate login:', error)
    throw error
  }
}

// API 路由处理器
export async function handleAggregateLoginCallback(request: Request) {
  try {
    const url = new URL(request.url)
    const { searchParams } = url

    const type = searchParams.get('type') as 'qq' | 'alipay' | 'douyin'
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      throw new Error(`Login error: ${error}`)
    }

    if (!type || !code) {
      throw new Error('Missing required parameters')
    }

    // 获取配置
    const config = {
      appid: process.env.AGGREGATE_LOGIN_APPID!,
      appkey: process.env.AGGREGATE_LOGIN_APPKEY!,
      redirectUri: `${process.env.NEXTAUTH_URL}/api/auth/callback/aggregate-login`
    }

    const provider = new AggregateLoginProvider(config)
    const profile = await provider.handleCallback(type, code)

    // 重定向到 NextAuth 回调处理
    const callbackUrl = `/api/auth/callback/aggregate-login?` +
      `type=${encodeURIComponent(type)}&` +
      `code=${encodeURIComponent(code)}&` +
      `profile=${encodeURIComponent(JSON.stringify(profile))}`

    return Response.redirect(callbackUrl)
  } catch (error) {
    console.error('Aggregate login callback error:', error)
    return Response.redirect(`/zh/signin?error=${encodeURIComponent(error.message)}`)
  }
}