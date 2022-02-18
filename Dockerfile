FROM node:16-alpine3.14

LABEL version="1.0"
LABEL description="NiceLogin"

WORKDIR /app

COPY ["package.json", "package-lock.json*", "./"]

RUN npm install && npm cache clean --force

COPY . .

EXPOSE 80

CMD [ "npm", "run", "start" ]