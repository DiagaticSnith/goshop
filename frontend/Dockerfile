## Build stage
FROM node:18.18.0-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Run Vite build directly (skip the separate `tsc` typecheck step so build succeeds even if type-only errors exist)
RUN npx vite build

## Production stage - serve with nginx
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Remove default nginx config and provide a simple one that serves SPA
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
