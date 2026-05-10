module.exports = {
  apps: [
    {
      name: 'yunashuo-backend',
      cwd: '/var/www/yunashuoAI/backend',
      script: 'dist/index.js',
      env_file: '/var/www/yunashuoAI/.env.local',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      max_memory_restart: '400M',
      error_file: '/var/log/yunashuo/backend-error.log',
      out_file: '/var/log/yunashuo/backend-out.log',
    },
    {
      name: 'yunashuo-frontend',
      cwd: '/var/www/yunashuoAI/frontend',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      env: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '500M',
      error_file: '/var/log/yunashuo/frontend-error.log',
      out_file: '/var/log/yunashuo/frontend-out.log',
    },
  ],
}
