FROM node:22-alpine AS frontend

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . ./
RUN npm run build

FROM nginx:1.27-alpine
ENV PORT=80 \
	API_BASE_URL=http://api:8000 \
	NGINX_ENVSUBST_FILTER=^(API_BASE_URL|PORT)$

COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=frontend /app/dist /usr/share/nginx/html

EXPOSE 80