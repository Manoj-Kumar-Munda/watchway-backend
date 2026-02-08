FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better layer caching
COPY package.json package-lock.json ./

RUN npm install

# Copy source code
COPY src/ ./src/
COPY public/ ./public/
COPY . .

# Expose the port the app runs on
EXPOSE 8000

# Run the application
CMD ["node", "-r", "dotenv/config", "--experimental-json-modules", "src/index.js"]