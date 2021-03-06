FROM node:8.4

COPY . /app

WORKDIR /app

RUN mkdir -p /app/logs

RUN npm install pm2@latest -g
RUN pm2 update
RUN npm install --deps

CMD ["pm2-docker", "start", "ecosystem.config.js", "--env", "production"]