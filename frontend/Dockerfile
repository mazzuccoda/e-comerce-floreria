# Base image
FROM node:20-alpine

# Install dependencies para desarrollo
RUN apk add --no-cache libc6-compat

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy app source
COPY . .

# Asegurarse de que el directorio .next existe y tiene permisos
RUN mkdir -p /app/.next && chmod -R 777 /app/.next

# Set environment variables
ENV NODE_ENV=development

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]
