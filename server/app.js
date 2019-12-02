'use strict'
const express = require('express')
const http = require('http')
const https = require('https')
const fs = require('fs')
const path = require('path')
const moment = require('moment')
const dateFormat = `${moment().format('YYYY-MM-DD HH:mm:ss:SSS')}`
const config = require('./config')
const returnJson = require('./utils/returnJson')
const { TagPlatForm } = require('./utils/log')
const { liveServer } = require('./utils/liveServer')
// const SocketServer = require('./utils/socketServer')
const app = express()

require('./utils/expressMiddleware')(app)

app.use('/api',require('./router')())

if (config.env !== 'dev') {
  app.route('/*')
    .all(function(req, res, next) {
      if (req.protocol === 'http') {
        res.redirect(301, `https://www.die.live`);
      } else next()
    })
    .get(function(req, res) {
      res.sendFile(path.resolve(app.get('appPath'),'index.html'))
    })
}

app.use(function(error, req, res, next) {
  TagPlatForm.error(`${dateFormat} [Error]Request ${req.originalUrl} Error: ${error}`)
  res.json(returnJson.RESULT.SYSTEM_FAIL, 500)
  next()
})

const server = config.env === 'dev' ? http.createServer(app) : https.createServer({
  key: fs.readFileSync(`${config.ceFilePath}/privkey.pem`),
  cert: fs.readFileSync(`${config.ceFilePath}/cert.pem`)
},app)
/*
const socketServer = SocketServer(server, {
  serveClient: false,
  pingInterval: 20000,
  pingTimeout: 20000,
  transports: ['polling','websocket'],
  origins: ['*:*']
})
*/
function startServer() {
  liveServer.run()
  /*
  socketServer.on('connection', function(socketServer) {
    console.log('a user connected');
    socketServer.on('disconnect', function() {
      console.log('user disconnected');
    });
    socketServer.on('chat', function(msg) {
      console.log('message: ' + msg);
    });
  });
  */
  server.listen(config.port, function() {
    console.info(`Express server listening on ${config.port}`,`environment is ${process.env.NODE_ENV}`)
  })
}
setImmediate(startServer)

if (config.env !== 'dev') {
  const httpServer = http.createServer(app)
  // eslint-disable-next-line no-inner-declarations
  function startHttpServer() {
    httpServer.listen(config.httpPort, function() {
      console.info(`Express server listening on ${config.httpPort}`,`environment is ${process.env.NODE_ENV}`)
    })
  }
  setImmediate(startHttpServer)
}
