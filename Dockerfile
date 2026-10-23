# ---------- 构建阶段 ----------
FROM node:22-alpine AS build

WORKDIR /app

# 国内网络下走镜像；想用官方源：--build-arg NPM_REGISTRY=https://registry.npmjs.org
ARG NPM_REGISTRY=https://registry.npmmirror.com
RUN npm config set registry "$NPM_REGISTRY" && npm config set fund false && npm config set audit false

# 先只拷依赖清单，利用层缓存
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . .
RUN npm run build

# ---------- 运行阶段 ----------
FROM nginx:1.27-alpine AS runtime

LABEL org.opencontainers.image.title="Subs" \
      org.opencontainers.image.description="把订阅理清，把选择留给自己。本地优先的订阅管理与续费决策应用" \
      org.opencontainers.image.licenses="MIT"

# 时区：报告里会用本地时间
RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Asia/Shanghai" > /etc/timezone && \
    apk del tzdata

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

# 以非 root 运行
RUN chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx && \
    touch /var/run/nginx.pid && chown nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]

