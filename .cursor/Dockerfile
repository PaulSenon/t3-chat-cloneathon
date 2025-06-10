# Development environment base image
FROM node:22-slim

# Create a non-root user
RUN useradd -m -s /bin/bash ubuntu

# Install system dependencies and package manager
RUN apt-get update && \
  apt-get install -y git make nano curl && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/* && \
  npm install -g corepack && \
  corepack enable && \
  corepack prepare --activate

# Switch to non-root user and set working directory to home
USER ubuntu
WORKDIR /home/ubuntu

# Dependencies installed at runtime, not build time
CMD ["bash"] 