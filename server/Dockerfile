FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy source code
COPY . .

# Ensure public directories exist (populated on first volume mount)
RUN mkdir -p /app/public/uploads /app/public/models /app/data

EXPOSE 3001

# Use node directly (no nodemon in production)
CMD ["node", "index.js"]