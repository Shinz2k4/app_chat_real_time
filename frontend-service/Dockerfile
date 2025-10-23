FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install deps (include dev for build)
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Build React app
RUN npm run build || true

# Start the application
CMD ["npm", "start"]
