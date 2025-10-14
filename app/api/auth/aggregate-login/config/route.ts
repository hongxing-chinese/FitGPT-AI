import { NextResponse } from 'next/server'

// 获取聚合登录配置
export async function GET() {
  const config = {
    appid: process.env.AGGREGATE_LOGIN_APPID,
    appkey: process.env.AGGREGATE_LOGIN_APPKEY,
    redirectUri: `${process.env.NEXTAUTH_URL}/api/auth/aggregate-login/callback`
  }

  if (!config.appid || !config.appkey) {
    return NextResponse.json(
      { error: 'Aggregate login not configured' },
      { status: 500 }
    )
  }

  return NextResponse.json({ config })
}