module.exports = {
  apps: [
    {
      name: "era-global-be",
      script: "server.js", // or app.js, index.js - check your main file
      cwd: "/var/www/era-global-be",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "/var/log/pm2/era-backend-error.log",
      out_file: "/var/log/pm2/era-backend-out.log",
      log_file: "/var/log/pm2/era-backend.log",
    },
  ],
};
