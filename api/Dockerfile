FROM node:20-slim

WORKDIR /app

# Install OpenSSL 1.1 specifically for Prisma
RUN apt-get update -y && \
    apt-get install -y ca-certificates curl gnupg wget && \
    echo "deb http://security.debian.org/debian-security bullseye-security main" > /etc/apt/sources.list.d/bullseye-security.list && \
    apt-get update -y && \
    apt-get install -y libssl1.1 procps && \
    rm -rf /var/lib/apt/lists/*

# Copy config files
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/

# Copy shared packages
COPY packages/shared-schemas ./packages/shared-schemas/


# We'll mount the src directory as a volume, so no need to copy it here

EXPOSE 5000