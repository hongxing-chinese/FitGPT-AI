"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { initiateAggregateLogin, AggregateLoginType } from "@/lib/aggregate-auth"

// 登录方式图标组件 - 使用外链图标
const LoginIcon = ({ src, alt }: { src: string; alt: string }) => (
  <img src={src} alt={alt} className="w-5 h-5" />
)

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handleLogin = async (type: AggregateLoginType) => {
    setIsLoading(type)
    try {
      await initiateAggregateLogin(type)
    } catch (error) {
      console.error('Login error:', error)
      // 这里可以添加错误提示
    } finally {
      setIsLoading(null)
    }
  }

  // 登录方式配置
  const loginMethods = [
    {
      type: 'qq' as AggregateLoginType,
      name: 'QQ',
      iconUrl: 'https://u.arsn.cn/assets/icon/qq.png',
      loadingText: '登录中...',
      buttonText: '使用 QQ 登录'
    },
    {
      type: 'wx' as AggregateLoginType,
      name: '微信',
      iconUrl: 'https://u.arsn.cn/assets/icon/wx.png',
      loadingText: '登录中...',
      buttonText: '使用微信登录'
    },
    {
      type: 'wxmp' as AggregateLoginType,
      name: '微信公众号',
      iconUrl: 'https://u.arsn.cn/assets/icon/wxmp.png',
      loadingText: '登录中...',
      buttonText: '使用微信公众号登录'
    },
    {
      type: 'alipay' as AggregateLoginType,
      name: '支付宝',
      iconUrl: 'https://u.arsn.cn/assets/icon/alipay.png',
      loadingText: '登录中...',
      buttonText: '使用支付宝登录'
    }
  ]

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">登录/注册</CardTitle>
          <CardDescription>
            选择您喜欢的登录方式
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loginMethods.map((method) => (
            <Button
              key={method.type}
              className="w-full"
              variant="outline"
              onClick={() => handleLogin(method.type)}
              disabled={isLoading === method.type}
            >
              <LoginIcon src={method.iconUrl} alt={method.name} />
              <span className="ml-2">
                {isLoading === method.type ? method.loadingText : method.buttonText}
              </span>
            </Button>
          ))}

          <div className="text-center text-sm text-gray-500 mt-4">
            登录即表示同意本站服务条款并开始接受我们的服务
          </div>
        </CardContent>
      </Card>
    </div>
  )
}