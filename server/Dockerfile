# Specify a base image
FROM node:alpine

# Specifying a working directory
WORKDIR /usr/app

# Install some dependency
COPY ./package.json ./
RUN npm install
COPY ./ ./

# Default command
CMD ["npm","run","start"]


FROM nginx
EXPOSE 80
