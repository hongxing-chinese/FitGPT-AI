import { NextRequest, NextResponse } from 'next/server'

// 处理聚合登录授权URL获取
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as 'qq' | 'alipay' | 'douyin'

    if (!type || !['qq', 'alipay', 'douyin'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid login type' },
        { status: 400 }
      )
    }

    // 获取聚合登录配置
    const appid = process.env.AGGREGATE_LOGIN_APPID
    const appkey = process.env.AGGREGATE_LOGIN_APPKEY
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/aggregate-login/callback`

    console.log('Aggregate login config:', { appid, hasAppKey: !!appkey, redirectUri })

    if (!appid || !appkey) {
      return NextResponse.json(
        { error: 'Aggregate login not configured' },
        { status: 500 }
      )
    }

    // 构建请求参数
    const params = new URLSearchParams({
      act: 'login',
      appid,
      appkey,
      type,
      redirect_uri: redirectUri
    })

    const apiUrl = `https://lxsd.top/connect.php?${params.toString()}`
    console.log('Calling aggregate login API:', apiUrl)

    // 调用聚合登录API
    const response = await fetch(apiUrl)

    console.log('Aggregate login API response status:', response.status)
    console.log('Aggregate login API response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Failed to fetch auth URL. Response:', errorText)
      throw new Error(`Failed to fetch auth URL: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('Aggregate login API response data:', JSON.stringify(data, null, 2))

    // 检查响应格式：聚合登录API返回 {code: 0, msg: "succ", type: "qq", url: "..."}
    if (data.code !== 0 || !data.url) {
      console.error('API error - missing success code or URL:', { code: data.code, url: data.url, msg: data.msg })
      throw new Error(`API error: ${data.msg || 'No URL returned'}`)
    }

    // 返回授权URL
    console.log('Successfully got auth URL:', data.url)
    return NextResponse.json({
      success: true,
      url: data.url,
      type: data.type
    })

  } catch (error) {
    console.error('Error getting auth URL:', error)
    return NextResponse.json(
      {
        error: 'Failed to get authorization URL',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}