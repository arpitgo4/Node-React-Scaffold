
FROM nginx:1.15.7-alpine

RUN rm /etc/nginx/conf.d/default.conf

COPY ./api-gateway.conf /etc/nginx/conf.d

EXPOSE 80