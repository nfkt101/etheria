FROM docker.io/library/node:22-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy package configuration
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose Vite's port (as configured in package.json dev script)
EXPOSE 3000

# Run the dev command
CMD ["npm", "run", "dev"]
