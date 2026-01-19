FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production || npm install --production

# Copy source
COPY . ./

# Expose port used by the app
EXPOSE 5000

# Use a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Start the server
ENV NODE_ENV=production
CMD ["node", "server.js"]
