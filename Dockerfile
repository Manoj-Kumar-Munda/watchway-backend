

FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json .

RUN npm ci --omit=dev

# Copy source code
COPY . .

# Expose the port the app runs on
EXPOSE 8000

# Run the application
CMD ["node", "-r", "dotenv/config", "--experimental-json-modules", "src/index.js"]