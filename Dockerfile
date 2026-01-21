# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build arguments
ARG NODE_ENV=production
ARG REACT_APP_ENVIRONMENT=production
ARG PORT=3004
ARG REACT_APP_GOOGLE_CLIENT_ID
ARG REACT_APP_SUPABASE_URL
ARG REACT_APP_SUPABASE_ANON_KEY
ARG REACT_APP_GEMINI_API_KEY
ARG CORS_ALLOW_ALL=true
ARG GIT_SHA

# Set environment variables for build
ENV NODE_ENV=${NODE_ENV}
ENV REACT_APP_ENVIRONMENT=${REACT_APP_ENVIRONMENT}
ENV PORT=${PORT}
ENV REACT_APP_GOOGLE_CLIENT_ID=${REACT_APP_GOOGLE_CLIENT_ID}
ENV REACT_APP_SUPABASE_URL=${REACT_APP_SUPABASE_URL}
ENV REACT_APP_SUPABASE_ANON_KEY=${REACT_APP_SUPABASE_ANON_KEY}
ENV REACT_APP_GEMINI_API_KEY=${REACT_APP_GEMINI_API_KEY}
ENV CORS_ALLOW_ALL=${CORS_ALLOW_ALL}
ENV CI=false
ENV ESLINT_NO_DEV_ERRORS=true
ENV GENERATE_SOURCEMAP=false

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Build arguments (needed in runtime too)
ARG NODE_ENV=production
ARG PORT=3004
ARG CORS_ALLOW_ALL=true

# Set runtime environment variables
ENV NODE_ENV=${NODE_ENV}
ENV PORT=${PORT}
ENV CORS_ALLOW_ALL=${CORS_ALLOW_ALL}

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder
COPY --from=builder /app/build ./build
COPY --from=builder /app/server-simple.mjs ./
COPY --from=builder /app/src ./src

# Expose port
EXPOSE ${PORT:-3004}

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:${PORT:-3004}/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the server
CMD ["node", "server-simple.mjs"]
