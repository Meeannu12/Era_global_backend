# MERN Stack Deployment on AWS EC2 with Domain Configuration

## Prerequisites

- AWS Account
- GoDaddy Domain (eraglobal.world)
- Git repositories (frontend and backend)
- MongoDB connection string

## Step 1: Launch EC2 Instance

### 1.1 Create EC2 Instance

1. Login to AWS Console → EC2 Dashboard
2. Click "Launch Instance"
3. **Instance Configuration:**
   - Name: `mern-stack-server`
   - AMI: Ubuntu Server 22.04 LTS (Free Tier)
   - Instance Type: t2.micro (Free Tier) or t3.small (recommended)
   - Key Pair: Create new or use existing
   - Storage: 20 GB gp3

### 1.2 Security Group Configuration

Create security group with following inbound rules:

```
Type            Protocol    Port Range    Source
SSH             TCP         22           0.0.0.0/0
HTTP            TCP         80           0.0.0.0/0
HTTPS           TCP         443          0.0.0.0/0
Custom TCP      TCP         3000         0.0.0.0/0
Custom TCP      TCP         5000         0.0.0.0/0
Custom TCP      TCP         8000         0.0.0.0/0
```

## Step 2: Connect to EC2 Instance

### 2.1 SSH Connection

```bash
# Make key file executable
chmod 400 your-key.pem

# Connect to instance
ssh -i "your-key.pem" ubuntu@your-ec2-ip
```

## Step 3: Server Setup and Dependencies

### 3.1 Update System

```bash
sudo apt update
sudo apt upgrade -y
```

### 3.2 Install Node.js and npm

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 3.3 Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

### 3.4 Install Nginx

```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 3.5 Install Git

```bash
sudo apt install git -y
```

## Step 4: Clone and Setup Backend

### 4.1 Clone Backend Repository

```bash
cd /home/ubuntu
git clone YOUR_BACKEND_GIT_URL backend
cd backend
```

### 4.2 Install Backend Dependencies

```bash
npm install
```

### 4.3 Create Environment File

```bash
nano .env
```

Add the following content:

```env
MONGO_URL= --> Your MongoDB url
PORT=3000
ALLOWED_ORIGINS=https://eraglobal.world
JWT_SECRET=raj95-UvEAS7egjnaM-very-secure
JWT_EXPIRES_IN=10m
COOKIE_EXPIRES_IN=10m
NODE_ENV=development

# Add other environment variables as needed
```

### 4.4 Test Backend

```bash
npm start
```

### 4.5 Setup PM2 for Backend

```bash
pm2 start npm --name "backend" -- start
pm2 save
pm2 startup ubuntu
```

## Step 5: Clone and Setup Frontend

### 5.1 Clone Frontend Repository

```bash
cd /home/ubuntu
git clone YOUR_FRONTEND_GIT_URL frontend
cd frontend
```

### 5.2 Install Frontend Dependencies

```bash
npm install
```

### 5.3 Create Frontend Environment File

```bash
nano .env
```

Add:

```env
VITE_BASE_URL=https://api.eraglobal.world  -> or use local server for development
# Add other frontend environment variables
```

### 5.4 Build Frontend

```bash
npm run build
```

## Step 6: Nginx Configuration

### 6.1 Create Nginx Configuration for API

```bash
sudo nano /etc/nginx/sites-available/api.eraglobal.world
```

Add configuration:

```nginx
server {
    listen 80;
    server_name api.eraglobal.world;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 6.2 Create Nginx Configuration for Frontend

```bash
sudo nano /etc/nginx/sites-available/eraglobal.world
```

Add configuration:

```nginx
server {
    listen 80;
    server_name eraglobal.world www.eraglobal.world;
    root /home/ubuntu/frontend/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 6.3 Enable Sites

```bash
sudo ln -s /etc/nginx/sites-available/api.eraglobal.world /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/eraglobal.world /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
```

### 6.4 Test and Restart Nginx

```bash
sudo nginx -t
sudo systemctl restart nginx
```

## Step 7: Domain Configuration (GoDaddy)

### 7.1 Get EC2 Elastic IP

1. Go to EC2 → Elastic IPs
2. Allocate new Elastic IP
3. Associate with your EC2 instance

### 7.2 Configure DNS in GoDaddy

1. Login to GoDaddy → DNS Management
2. Add/Edit A Records:

```
Type    Name    Value               TTL
A       @       YOUR_ELASTIC_IP     1 Hour
A       www     YOUR_ELASTIC_IP     1 Hour
A       api     YOUR_ELASTIC_IP     1 Hour
```

Wait 10-15 minutes for DNS propagation.

## Step 8: SSL Certificate Setup (Let's Encrypt)

### 8.1 Install Certbot

```bash
sudo apt install snapd
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

### 8.2 Obtain SSL Certificates

```bash
sudo certbot --nginx -d eraglobal.world -d www.eraglobal.world -d api.eraglobal.world
```

### 8.3 Auto-renewal Setup

```bash
sudo crontab -e
```

Add line:

```
0 12 * * * /usr/bin/certbot renew --quiet
```

## Step 9: File Permissions and Security

### 9.1 Set Proper Permissions

```bash
# Backend permissions
sudo chown -R ubuntu:ubuntu /home/ubuntu/backend
chmod -R 755 /home/ubuntu/backend

# Frontend permissions
sudo chown -R ubuntu:ubuntu /home/ubuntu/frontend
chmod -R 755 /home/ubuntu/frontend/build
```

### 9.2 Nginx User Permissions

```bash
sudo usermod -a -G ubuntu www-data
```

## Step 10: Final Verification

### 10.1 Check Services

```bash
# Check PM2 processes
pm2 status

# Check Nginx status
sudo systemctl status nginx

# Check SSL certificates
sudo certbot certificates
```

### 10.2 Test URLs

1. Frontend: https://eraglobal.world
2. API: https://api.eraglobal.world

## Step 11: Useful Commands

### 11.1 PM2 Commands

```bash
pm2 list                    # List all processes
pm2 restart backend         # Restart backend
pm2 logs backend           # View backend logs
pm2 stop backend           # Stop backend
pm2 delete backend         # Delete backend process
```

### 11.2 Nginx Commands

```bash
sudo nginx -t              # Test configuration
sudo systemctl reload nginx # Reload nginx
sudo systemctl restart nginx # Restart nginx
```

### 11.3 Update Application

```bash
# Backend update
cd /home/ubuntu/backend
git pull origin main
npm install
pm2 restart backend

# Frontend update
cd /home/ubuntu/frontend
git pull origin main
npm install
npm run build
sudo systemctl reload nginx
```

## Step 12: Environment Variables Examples

### Backend .env

```env
MONGO_URL= --> Your MongoDB url
PORT=3000
ALLOWED_ORIGINS=https://eraglobal.world
JWT_SECRET=raj95-UvEAS7egjnaM-very-secure
JWT_EXPIRES_IN=10m
COOKIE_EXPIRES_IN=10m
NODE_ENV=development
```

### Frontend .env

```env
VITE_BASE_URL=https://api.eraglobal.world
```

## Troubleshooting

### Common Issues:

1. **Port already in use**: `sudo lsof -i :3000` then `sudo kill -9 PID`
2. **Permission denied**: Check file ownership and permissions
3. **502 Bad Gateway**: Check if backend is running with `pm2 status`
4. **DNS not resolving**: Wait for DNS propagation (up to 24 hours)

### Log Locations:

- Nginx error logs: `/var/log/nginx/error.log`
- PM2 logs: `pm2 logs`
- System logs: `journalctl -u nginx`

## Security Best Practices

1. **Firewall Setup:**

```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
```

2. **Regular Updates:**

```bash
sudo apt update && sudo apt upgrade
```

3. **Monitor Resources:**

```bash
htop
df -h
```

This documentation provides a complete setup for deploying your MERN stack application on AWS EC2 with proper domain configuration and SSL certificates.
