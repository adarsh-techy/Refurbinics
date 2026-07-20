# Vite bakes VITE_* env vars into the JS bundle at build time, not runtime —
# so the API URL the built app will call has to be supplied as a build arg,
# e.g.:
#   docker build --build-arg VITE_API_URL=https://api.example.com/api -t refurbinics-frontend .
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL
RUN test -n "$VITE_API_URL" || (echo "ERROR: VITE_API_URL build-arg is required" >&2 && exit 1)
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# nginx-unprivileged runs its master process as a non-root user (uid 101)
# instead of root — the stock nginx:alpine image needs root for its master
# process to bind port 80, even though workers already drop privileges.
FROM nginxinc/nginx-unprivileged:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY security-headers.conf /etc/nginx/security-headers.conf

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/ || exit 1
