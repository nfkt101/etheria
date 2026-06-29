FROM node:22-bookworm

# Install system dependencies for Tauri, GTK and webkit
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    wget \
    file \
    libssl-dev \
    libgtk-3-dev \
    libwebkit2gtk-4.1-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

WORKDIR /app

# Copy package config first to leverage caching
COPY package.json package-lock.json* ./

# Copy everything else
COPY . .

# Expose Vite's dev server port
EXPOSE 3000

# Run the dev command
CMD ["npm", "run", "dev"]
