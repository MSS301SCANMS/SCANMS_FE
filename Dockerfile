# Stage 1: Development
FROM node:22-alpine AS development

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

EXPOSE 5173

# Run Vite listening on all interfaces so it's accessible from host
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
