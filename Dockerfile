# Build stage
FROM node:20-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# In a real production app, you would build the Vite frontend here
# RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app
COPY --from=builder /app ./

EXPOSE 3001
EXPOSE 5173

# Start both backend and frontend (for demo/dev purposes in one container)
# In true prod, these would be separate containers
CMD ["sh", "-c", "npm run server & npm run dev"]
