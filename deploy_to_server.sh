#!/bin/bash
# Deploy to Alibaba Cloud Lightweight Server

if [ -z "$1" ]; then
    echo "Usage: ./deploy_to_server.sh <PUBLIC_IP>"
    echo "Example: ./deploy_to_server.sh 47.93.xxx.xxx"
    exit 1
fi

PUBLIC_IP=$1
SSH_USER="root"
if [ -z "$SERVER_PASSWORD" ]; then
    echo "[ERROR] 请先设置环境变量: export SERVER_PASSWORD=你的服务器密码"
    exit 1
fi
SSH_PASS="$SERVER_PASSWORD"
GAME_DIR="/var/www/game/public"

echo "=================================================="
echo "  Deploying to Alibaba Cloud Lightweight Server"
echo "=================================================="
echo ""
echo "Server: $PUBLIC_IP"
echo ""

# Create SSH command with password (requires sshpass)
if ! command -v sshpass &> /dev/null; then
    echo "[WARN] sshpass not installed. Using manual SSH..."
    echo ""
    echo "Please run these commands manually on your server:"
    echo ""
    echo "1. SSH into server:"
    echo "   ssh root@$PUBLIC_IP"
    echo "   Password: $SSH_PASS"
    echo ""
    echo "2. Install nginx:"
    echo "   yum install -y nginx"
    echo ""
    echo "3. Create game directory:"
    echo "   mkdir -p $GAME_DIR"
    echo ""
    echo "4. Upload files (from your local machine):"
    echo "   scp outputs/card-game.html root@$PUBLIC_IP:$GAME_DIR/index.html"
    echo "   scp game-server.py root@$PUBLIC_IP:$GAME_DIR/"
    echo ""
    echo "5. Configure nginx:"
    echo "   cat > /etc/nginx/conf.d/game.conf << 'EOF'"
    echo "server {"
    echo "    listen 80;"
    echo "    server_name _;"
    echo "    root $GAME_DIR;"
    echo "    index index.html;"
    echo "    location / {"
    echo "        try_files \$uri \$uri/ /index.html;"
    echo "    }"
    echo "}"
    echo "EOF"
    echo ""
    echo "6. Start nginx:"
    echo "   systemctl start nginx"
    echo "   systemctl enable nginx"
    echo ""
    echo "7. Open firewall:"
    echo "   firewall-cmd --permanent --add-service=http"
    echo "   firewall-cmd --reload"
    echo ""
    echo "=================================================="
    echo "  Game URL: http://$PUBLIC_IP"
    echo "=================================================="
    exit 0
fi

# Automated deployment with sshpass
echo "[..] Connecting to server..."

# Test connection
sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no $SSH_USER@$PUBLIC_IP "echo 'Connected successfully'" || {
    echo "[ERROR] Failed to connect to server"
    exit 1
}

echo "[OK] Connected"
echo ""

# Install nginx
echo "[..] Installing nginx..."
sshpass -p "$SSH_PASS" ssh $SSH_USER@$PUBLIC_IP "yum install -y nginx" || {
    echo "[ERROR] Failed to install nginx"
    exit 1
}
echo "[OK] nginx installed"

# Create game directory
echo "[..] Creating game directory..."
sshpass -p "$SSH_PASS" ssh $SSH_USER@$PUBLIC_IP "mkdir -p $GAME_DIR"

# Upload game files
echo "[..] Uploading game files..."
sshpass -p "$SSH_PASS" scp outputs/card-game.html $SSH_USER@$PUBLIC_IP:$GAME_DIR/index.html
sshpass -p "$SSH_PASS" scp game-server.py $SSH_USER@$PUBLIC_IP:$GAME_DIR/
echo "[OK] Files uploaded"

# Configure nginx
echo "[..] Configuring nginx..."
sshpass -p "$SSH_PASS" ssh $SSH_USER@$PUBLIC_IP "cat > /etc/nginx/conf.d/game.conf << 'EOF'
server {
    listen 80;
    server_name _;
    root $GAME_DIR;
    index index.html;
    
    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF"

# Start nginx
echo "[..] Starting nginx..."
sshpass -p "$SSH_PASS" ssh $SSH_USER@$PUBLIC_IP "systemctl start nginx && systemctl enable nginx"
echo "[OK] nginx started"

# Configure firewall
echo "[..] Configuring firewall..."
sshpass -p "$SSH_PASS" ssh $SSH_USER@$PUBLIC_IP "firewall-cmd --permanent --add-service=http && firewall-cmd --reload" 2>/dev/null || echo "[WARN] Firewall config skipped"

echo ""
echo "=================================================="
echo "  Deployment Complete!"
echo "=================================================="
echo ""
echo "  Game URL: http://$PUBLIC_IP"
echo ""
echo "  SSH Access:"
echo "    ssh root@$PUBLIC_IP"
echo "    Password: $SSH_PASS"
echo ""
echo "=================================================="
