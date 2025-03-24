FROM node:20-slim

WORKDIR /app

# Install OpenSSL 1.1 specifically for Prisma and add curl for healthchecks
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

# ✅ Copy your actual source code (this was missing)
COPY api/src ./api/src

# ✅ Copy shared packages (if needed)
COPY packages/shared-schemas ./packages/shared-schemas/

# Pre-install dependencies to speed up container startup
RUN npm install

# Pre-generate Prisma client to avoid doing it at runtime
RUN npx prisma generate

# Add a startup script with better error handling
RUN echo '#!/bin/sh\n\
    set -e\n\
    echo "Starting API service..."\n\
    echo "Running database migrations..."\n\
    npm run migrate\n\
    echo "Starting development server..."\n\
    exec npm run dev:api -- "$@"\n' > /app/start.sh && chmod +x /app/start.sh

EXPOSE 5000

ENTRYPOINT ["/app/start.sh"]
