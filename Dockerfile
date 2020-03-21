FROM node:13-alpine

RUN apk update && \
    apk add --no-cache tini && \
    apk add --update git

WORKDIR /bopcorn
COPY . .

RUN npm install
RUN npm install -g browserify
RUN browserify client/main.js -o webroot/clientBundle.js

EXPOSE 8080
ENV NODE_ENV=production
USER node

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server/main.js"]
