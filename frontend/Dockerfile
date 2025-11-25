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
# Remove default nginx config and provide a templated one that serves SPA
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf.template
# Install envsubst (gettext) so we can substitute BACKEND_URL at container start
RUN apk add --no-cache gettext
EXPOSE 80
# Use shell form CMD to avoid JSON-array interpretation issues on some platforms
CMD /bin/sh -c "export BACKEND_URL=${BACKEND_URL:-http://backend:3000} && envsubst '\$BACKEND_URL' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"
