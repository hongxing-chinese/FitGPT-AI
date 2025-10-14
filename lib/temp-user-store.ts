// 临时用户数据存储(生产环境应使用 Redis)
// 用于在 callback -> token -> userinfo 之间传递用户数据

interface TempUserData {
  social_uid: string
  nickname: string
  faceimg: string
  gender: string
  location: string | null
  email: string | null
  mobile: string | null
  type: string
  access_token: string
  expiresAt: number
}

const tempDataStore = new Map<string, TempUserData>()

// 每5分钟清理一次过期数据
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of tempDataStore.entries()) {
    if (now > value.expiresAt) {
      tempDataStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

export function setTempUserData(code: string, data: Omit<TempUserData, 'expiresAt'>): void {
  tempDataStore.set(code, {
    ...data,
    expiresAt: Date.now() + 10 * 60 * 1000 // 10分钟过期
  })
}

export function getTempUserData(code: string): TempUserData | undefined {
  const data = tempDataStore.get(code)
  if (data && Date.now() < data.expiresAt) {
    return data
  }
  tempDataStore.delete(code)
  return undefined
}

export function deleteTempUserData(code: string): void {
  tempDataStore.delete(code)
}
