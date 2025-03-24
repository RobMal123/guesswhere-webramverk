#!/bin/bash

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Starting deployment process...${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Installing Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    rm get-docker.sh
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed. Installing Docker Compose...${NC}"
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Create necessary directories
echo -e "${GREEN}Creating necessary directories...${NC}"
mkdir -p /opt/app
cd /opt/app

# Clone the repository (replace with your repository URL)
echo -e "${GREEN}Cloning repository...${NC}"
git clone https://github.com/RobMal123/webramverk-projekt.git .

# Copy environment files
echo -e "${GREEN}Setting up environment files...${NC}"
cp .env.example .env

# Build and start the containers
echo -e "${GREEN}Building and starting containers...${NC}"
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Wait for the database to be ready
echo -e "${GREEN}Waiting for database to be ready...${NC}"
sleep 10

# Run database migrations
echo -e "${GREEN}Running database migrations...${NC}"
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head

# Set up Nginx as reverse proxy
echo -e "${GREEN}Setting up Nginx...${NC}"
sudo apt-get update
sudo apt-get install -y nginx

# Create Nginx configuration
cat << EOF | sudo tee /etc/nginx/sites-available/app
server {
    listen 80;
    server_name guesswhere.site;  # Replace with your domain

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/app /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# Set up SSL with Certbot
echo -e "${GREEN}Setting up SSL...${NC}"
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com  # Replace with your domain

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${GREEN}Your application is now running at https://your-domain.com${NC}" 