"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { initiateAggregateLogin } from "@/lib/aggregate-auth"

// 登录方式图标组件
const QQIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#12B7F5">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
    <circle cx="9" cy="10" r="1.5"/>
    <circle cx="15" cy="10" r="1.5"/>
    <path d="M12 16c-1.48 0-2.75-.81-3.45-2h6.9c-.7 1.19-1.97 2-3.45 2z"/>
  </svg>
)

const AlipayIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1677FF">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
    <path d="M7 12h10M10 8v8M14 8v8" strokeWidth="2" stroke="#1677FF" fill="none"/>
  </svg>
)

const DouyinIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#000000">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
    <path d="M10 8v8c0 1.1.9 2 2 2s2-.9 2-2v-8M14 6h-4"/>
  </svg>
)

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handleLogin = async (type: 'qq' | 'alipay' | 'douyin') => {
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
          <Button
            className="w-full"
            variant="outline"
            onClick={() => handleLogin('qq')}
            disabled={isLoading === 'qq'}
          >
            <QQIcon />
            <span className="ml-2">
              {isLoading === 'qq' ? '登录中...' : '使用 QQ 登录'}
            </span>
          </Button>

          <Button
            className="w-full"
            variant="outline"
            onClick={() => handleLogin('alipay')}
            disabled={isLoading === 'alipay'}
          >
            <AlipayIcon />
            <span className="ml-2">
              {isLoading === 'alipay' ? '登录中...' : '使用支付宝登录'}
            </span>
          </Button>

          <Button
            className="w-full"
            variant="outline"
            onClick={() => handleLogin('douyin')}
            disabled={isLoading === 'douyin'}
          >
            <DouyinIcon />
            <span className="ml-2">
              {isLoading === 'douyin' ? '登录中...' : '使用抖音登录'}
            </span>
          </Button>

          <div className="text-center text-sm text-gray-500 mt-4">
            登录即表示同意本站服务条款并开始接受我们的服务
          </div>
        </CardContent>
      </Card>
    </div>
  )
}