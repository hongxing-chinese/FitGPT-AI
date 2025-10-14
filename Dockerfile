# 多阶段构建 Dockerfile for FitGPT AI

# =================================================================
# 阶段 1: 依赖安装
# =================================================================
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制包管理文件
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile


# =================================================================
# 阶段 2: 构建应用
# =================================================================
FROM node:20-alpine AS builder
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 从 deps 阶段复制已安装的依赖
COPY --from=deps /app/node_modules ./node_modules

# 复制源代码
COPY . .

# ----------------- 接收构建时环境变量 -----------------
ARG ADMIN_USER_IDS
ARG AGGREGATE_LOGIN_APPID
ARG AGGREGATE_LOGIN_APPKEY
ARG NEXTAUTH_SECRET
ARG NEXTAUTH_URL
ARG DB_PROVIDER
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SUPABASE_URL
ARG SUPABASE_SERVICE_ROLE_KEY
ARG DEFAULT_OPENAI_BASE_URL
ARG DEFAULT_OPENAI_API_KEY
ARG KEY_ENCRYPTION_SECRE

# 将接收到的 ARG 设置为环境变量，供 next build 使用
ENV ADMIN_USER_IDS=$ADMIN_USER_IDS
ENV AGGREGATE_LOGIN_APPID=$AGGREGATE_LOGIN_APPID
ENV AGGREGATE_LOGIN_APPKEY=$AGGREGATE_LOGIN_APPKEY
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV DB_PROVIDER=$DB_PROVIDER
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
ENV DEFAULT_OPENAI_BASE_URL=$DEFAULT_OPENAI_BASE_URL
ENV DEFAULT_OPENAI_API_KEY=$DEFAULT_OPENAI_API_KEY
ENV KEY_ENCRYPTION_SECRE=$KEY_ENCRYPTION_SECRE
# ----------------------------------------------------------------

# 设置通用构建时环境变量
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# 增加 Node.js 的内存限制, 解决构建时内存溢出问题
ENV NODE_OPTIONS=--max-old-space-size=4096

# 构建应用
RUN pnpm run build


# =================================================================
# 阶段 3: 运行时镜像 (runner)
# =================================================================
FROM node:20-alpine AS runner
WORKDIR /app

# 创建非root用户，增强安全性
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 安装 pnpm
RUN npm install -g pnpm

# 复制必要的文件
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# 复制 Next.js 在 standalone 模式下构建的产物
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 设置运行时环境变量
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 切换到非root用户
USER nextjs

# 暴露端口
EXPOSE 3000

# 启动命令
# Next.js standalone 模式下，启动文件通常在 ./server.js
CMD ["node", "server.js"]