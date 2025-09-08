# 1. Base image
FROM node:20-alpine AS base

# 2. Create a non-root user and group
RUN apk add --no-cache su-exec && \
    addgroup -g 1001 -S nextjs && \
    adduser -S nextjs -u 1001

# 3. Set working directory
WORKDIR /app

# 4. Install dependencies
COPY package*.json ./
RUN npm install

# 5. Copy app source
COPY . .

# 6. Change ownership to the non-root user
RUN chown -R nextjs:nextjs /app

# 7. Switch to the non-root user
USER nextjs

# 8. Set environment variables
ENV NODE_ENV=development

# 9. Expose port and define command
EXPOSE 3000
CMD ["npm", "run", "dev"]
