FROM node:18-alpine as build
WORKDIR /app
ARG VITE_BACKEND_URL
# Make build-time VITE_BACKEND_URL available to the build process
ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}
COPY package.json package-lock.json* ./
# Install all deps (including dev) so build tools (tsc, vite) are available
RUN npm install --silent --no-audit --no-fund
COPY . .
# Build the app (Vite will pick up VITE_BACKEND_URL from the environment)
RUN npm run build

FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
