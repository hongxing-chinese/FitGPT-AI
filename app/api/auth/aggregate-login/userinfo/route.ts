import { NextRequest, NextResponse } from 'next/server'
import { getTempUserData } from '@/lib/temp-user-store'

// NextAuth 的 userinfo endpoint
// 这个endpoint被NextAuth调用来获取用户信息
export async function GET(request: NextRequest) {
  try {
    // NextAuth 通过 Authorization header 传递 access_token
    const authHeader = request.headers.get('authorization')
    const accessToken = authHeader?.replace('Bearer ', '')

    console.log('Userinfo endpoint called with token:', accessToken?.substring(0, 50))

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Missing access token' },
        { status: 401 }
      )
    }

    // 尝试从临时存储获取用户数据
    const userData = getTempUserData(accessToken)

    if (userData) {
      console.log('User data found in temp store')

      // 返回符合 OpenID Connect 标准的用户信息
      return NextResponse.json({
        sub: `${userData.type}_${userData.social_uid}`,
        name: userData.nickname,
        picture: userData.faceimg,
        email: userData.email,
        // 自定义字段
        type: userData.type,
        social_uid: userData.social_uid,
        nickname: userData.nickname,
        faceimg: userData.faceimg,
        gender: userData.gender,
        location: userData.location,
        mobile: userData.mobile
      })
    }

    // 如果在临时存储中找不到,尝试解析 access_token
    // access_token 格式可能是: temp_qq_XXXXX_timestamp
    if (accessToken.startsWith('temp_')) {
      const parts = accessToken.split('_')
      if (parts.length >= 3) {
        const type = parts[1]
        const social_uid = parts[2]

        console.log('Parsed access token:', { type, social_uid })

        return NextResponse.json({
          sub: `${type}_${social_uid}`,
          name: `${type}_user`,
          picture: null,
          email: null,
          type,
          social_uid,
          nickname: `${type}_user`
        })
      }
    }

    console.error('Unable to retrieve user info for token')
    return NextResponse.json(
      { error: 'Invalid access token' },
      { status: 401 }
    )
  } catch (error) {
    console.error('Userinfo endpoint error:', error)
    return NextResponse.json(
      { error: 'Failed to get user info' },
      { status: 500 }
    )
  }
}
