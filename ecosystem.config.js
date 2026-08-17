module.exports = {
  apps: [{
    name: 'cascr-api',
    script: './api/index.js',
    instances: 1,
    exec_mode: 'fork',
    node_args: '--max-old-space-size=128',
    env: {
      NODE_ENV: 'development',
      PORT: 8201,
      DISABLE_BG_TASKS: 'false',
      RUN_THUMBNAIL_SCAN: 'false'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 8201,
      DISABLE_BG_TASKS: 'false',
      RUN_THUMBNAIL_SCAN: 'false'
    },
    // Auto-restart
    watch: false,
    max_memory_restart: '150M',
    // Logging
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    error_file: './logs/error.log',
    out_file: './logs/output.log',
    merge_logs: true,
    // Graceful restart
    kill_timeout: 5000,
    listen_timeout: 10000,
    // Restart policy
    max_restarts: 10,
    restart_delay: 4000,
    autorestart: true,
    // Cron restart (restart every day at 4am to refresh memory)
    cron_restart: '0 4 * * *'
  }]
};
