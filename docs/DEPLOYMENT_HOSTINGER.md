# Hostinger Production Deployment Guide
## Node.js Application, PM2 Process Manager, Nginx Reverse Proxy & SSL Setup

---

### 1. Prerequisites on Hostinger VPS (Ubuntu 22.04 / 24.04 LTS)

1. Connect to VPS via SSH:
   ```bash
   ssh root@<YOUR_HOSTINGER_SERVER_IP>
   ```

2. Update system packages:
   ```bash
   apt update && apt upgrade -y
   ```

3. Install Node.js (v20 or v22 LTS) and Git:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
   apt install -y nodejs git nginx
   ```

4. Install PM2 globally:
   ```bash
   npm install -g pm2
   ```

---

### 2. Application Deployment

1. Clone or upload application repository to `/var/www/ushainstitute`:
   ```bash
   mkdir -p /var/www/ushainstitute
   cd /var/www/ushainstitute
   git clone <YOUR_GIT_REPO_URL> .
   ```

2. Install production dependencies:
   ```bash
   npm install --omit=dev
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   nano .env
   ```
   *Fill in your MongoDB Atlas connection string, JWT secrets, and domain URLs.*

4. Seed production database:
   ```bash
   node config/seed-database.js
   ```

---

### 3. Process Management with PM2

1. Start application with PM2:
   ```bash
   pm2 start server.js --name "ushainstitute-app" --time
   ```

2. Configure PM2 to restart on system boot:
   ```bash
   pm2 startup
   # Copy and execute the generated command
   pm2 save
   ```

3. Helpful PM2 commands:
   ```bash
   pm2 status
   pm2 logs ushainstitute-app
   pm2 restart ushainstitute-app
   ```

---

### 4. Nginx Reverse Proxy Configuration

1. Create Nginx site configuration:
   ```bash
   nano /etc/nginx/sites-available/ushainstitute
   ```

2. Add configuration:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;

       client_max_body_size 10M;

       location / {
           proxy_pass http://127.0.0.1:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }

       # Static asset caching
       location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2)$ {
           proxy_pass http://127.0.0.1:5000;
           expires 7d;
           add_header Cache-Control "public, no-transform";
       }
   }
   ```

3. Enable configuration and test Nginx:
   ```bash
   ln -s /etc/nginx/sites-available/ushainstitute /etc/nginx/sites-enabled/
   nginx -t
   systemctl restart nginx
   ```

---

### 5. Free Let's Encrypt SSL Certificate Setup

1. Install Certbot:
   ```bash
   apt install -y certbot python3-certbot-nginx
   ```

2. Obtain and install SSL certificate:
   ```bash
   certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

3. Certbot will automatically configure HTTPS redirect and auto-renewal.
   Verify auto-renewal:
   ```bash
   certbot renew --dry-run
   ```

---

### 6. Production Health Check

- Public website: `https://yourdomain.com/`
- Marksheet verification: `https://yourdomain.com/result?rollNo=UIS2026001`
- Certificate verification: `https://yourdomain.com/certificate?certNo=UIS2026001`
- Admit card portal: `https://yourdomain.com/admit-card?rollNo=UIS2026001`
- Administrative CMS: `https://yourdomain.com/admin`
