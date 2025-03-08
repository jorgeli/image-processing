FROM node:20-slim

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
COPY tsconfig.json ./

# Copy shared packages
COPY packages/shared-schemas ./packages/shared-schemas/

# Install dependencies
RUN npm install


