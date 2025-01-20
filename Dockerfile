FROM node:14.16.0-alpine as build

WORKDIR /app

#copy react app to container
COPY . /app/

#prepare container for building react
RUN npm install
RUN npm run build

#prepare nginx
FROM nginx:1.16.0-alpine
COPY --from=build /app/build /usr/share/nginx/html
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx/nginx.conf /etc/nginx/conf.d

#start nginx
EXPOSE 80
CMD ["nginx","-g","daemon off;"]