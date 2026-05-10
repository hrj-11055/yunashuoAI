#!/bin/bash
# yunashuoAI 服务器部署脚本
set -e

echo "=== yunashuoAI 部署 ==="

# 后端构建
echo "[1/4] 构建后端..."
cd backend && npm install && npm run build && cd ..

# 前端构建
echo "[2/4] 构建前端..."
cd frontend && npm install && NODE_OPTIONS=--max-old-space-size=512 npm run build && cd ..

# 重启 PM2
echo "[3/4] 重启服务..."
pm2 start ecosystem.config.js || pm2 restart ecosystem.config.js

# 保存 PM2 进程列表
pm2 save

echo "[4/4] 完成！"
pm2 status
