# Use stable Node.js runtime as parent image
FROM node:20-alpine

# Set the working container directory
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install clean production and dev dependencies
RUN npm install

# Copy all workspace files
COPY . .

# Run production esbuild bundling for backend and Vite compiling for frontend static dist
RUN npm run build

# Expose the server ingress port 3000
EXPOSE 3000

# Set environment production flag
ENV NODE_ENV=production

# Boot the microkernel server
CMD ["npm", "start"]
