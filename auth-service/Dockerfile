# --- Stage 1: Base ---------------------------
# Start from the official Node.js 18 image
# "alpine" is a tiny Linux distribution - keeps the image small
FROM node:18-alpine

# Set the working directory inside the container
# All subsequent commands run from here
WORKDIR /app

# --- Stage 2: Dependencies --------------------
# Copy package files first - before copying the rest of the code
# This is a Docker best practice called "layer caching"
# If you code changes but package.json doesn't, Docker skips npm install
COPY package*.json ./

# Install only production dependencies - no nodemon or other dev tools
RUN npm install --only=production

# --- Stage 3: Application code -----------------
# Copy the rest of the source code into the container
COPY src/ ./src/

# --- Stage 4: Configuration --------------------
# Document which port the service listens on
# This doesn't actually open the port -that's done in docker-compose
EXPOSE 3001

# --- Stage 5: Start ----------------------------
# The command that runs when the container starts
# We use "node" directly instead of "nodemon" - no auto-restarts in production
CMD ["node", "src/index.js"]
