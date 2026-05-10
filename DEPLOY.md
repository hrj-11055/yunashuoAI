# yunashuoAI 部署指南

## 服务器环境要求

- 服务器：47.113.125.147（阿里云 4C16G）
- Node.js 18+
- PM2 (`npm install -g pm2`)
- Nginx

## 首次部署

```bash
# 1. 连接服务器
ssh root@47.113.125.147

# 2. 安装 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# 3. 安装 PM2 + Nginx
npm install -g pm2
apt-get install -y nginx

# 4. 克隆项目
mkdir -p /var/www && cd /var/www
git clone https://github.com/<username>/yunashuoAI.git
cd yunashuoAI

# 5. 配置环境变量
cp .env.example .env.local
vim .env.local  # 填入真实 API Keys 和密码

# 6. 创建日志目录
mkdir -p /var/log/yunashuo

# 7. 构建并启动
bash deploy.sh

# 8. 配置 Nginx
cp nginx.conf /etc/nginx/sites-available/yunashuo
ln -s /etc/nginx/sites-available/yunashuo /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# 9. 设置开机自启
pm2 startup
```

## 更新部署

```bash
ssh root@47.113.125.147
cd /var/www/yunashuoAI
git pull
bash deploy.sh
```

## 验证

```bash
curl http://47.113.125.147/health  # 应返回 {"ok":true}
```
