FROM docker.io/library/node:22-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy package configuration and pre-built node_modules from host
COPY package.json package-lock.json* ./
COPY node_modules ./node_modules

# Copy the rest of the application
COPY . .

# Expose Vite's port (as configured in package.json dev script)
EXPOSE 3000

# Run the dev command
CMD ["npm", "run", "dev"]
