# Dockerfile
FROM node:18-alpine

# Create app dir
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm ci --production

# Copy source
COPY . .

# Build (if you have build step)
# RUN npm run build

# Expose port (change to your app port)
ENV PORT=3000
EXPOSE 3000

# Start app
CMD ["node", "main.js"]
