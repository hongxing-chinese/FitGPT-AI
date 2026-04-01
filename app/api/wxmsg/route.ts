import { NextRequest, NextResponse } from 'next/server';

// 配置项 - 通过环境变量设置
const WX_TOKEN = process.env.WX_TOKEN || '';  // 微信开发者平台配置的TOKEN
const MSG_TOKEN = process.env.MSG_TOKEN || ''; // 森遇聚合登录的通信TOKEN

// 微信签名验证
function checkSignature(signature: string, timestamp: string, nonce: string): boolean {
  const arr = [WX_TOKEN, timestamp, nonce].sort();
  const tmpStr = arr.join('');
  
  // 使用 Web Crypto API 计算 SHA1
  const encoder = new TextEncoder();
  const data = encoder.encode(tmpStr);
  
  // 简单的 SHA1 实现（Node.js 环境）
  const crypto = require('crypto');
  const hash = crypto.createHash('sha1').update(tmpStr).digest('hex');
  
  return hash === signature;
}

// GET 请求 - 微信服务器验证
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const signature = searchParams.get('signature') || '';
  const timestamp = searchParams.get('timestamp') || '';
  const nonce = searchParams.get('nonce') || '';
  const echostr = searchParams.get('echostr') || '';

  // 微信验证请求
  if (echostr) {
    if (checkSignature(signature, timestamp, nonce)) {
      return new NextResponse(echostr, { status: 200 });
    }
    return new NextResponse('Invalid signature', { status: 403 });
  }

  return new NextResponse('OK', { status: 200 });
}

// POST 请求 - 接收微信消息并转发
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  if (!MSG_TOKEN) {
    return new NextResponse('MSG_TOKEN not configured', { status: 500 });
  }

  const targetUrl = `https://u.arsn.cn/wxpush.php?app=${MSG_TOKEN}`;
  
  try {
    // 获取原始 XML 数据
    const rawXml = await request.text();
    
    // 构建转发参数
    const forwardParams = new URLSearchParams();
    forwardParams.append('xml', rawXml);
    forwardParams.append('mptoken', WX_TOKEN);
    
    // 添加 GET 参数
    searchParams.forEach((value, key) => {
      forwardParams.append(key, value);
    });

    // 转发请求到森遇平台
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: forwardParams.toString(),
    });

    const result = await response.text();
    return new NextResponse(result, { 
      status: 200,
      headers: { 'Content-Type': 'text/xml; charset=utf-8' }
    });
    
  } catch (error) {
    console.error('WeChat message forward error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
