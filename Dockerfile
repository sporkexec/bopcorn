FROM node:13-alpine
EXPOSE 8080
ENV NODE_ENV=production
RUN apk add --update git tini
ENTRYPOINT ["/sbin/tini", "--"]
WORKDIR /bopcorn
COPY . .
RUN yarn install
RUN yarn build
USER node
CMD ["node", "server/main.js"]
