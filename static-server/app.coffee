app          = module.exports = require('express')();
server       = require('http').Server(app);
cookieParser = require 'cookie-parser'
bodyParser   = require 'body-parser'
express      = require 'express' 
path         = require 'path'
logger       = require 'morgan'
Config       = require 'config'

app.use (req, res, next) ->
  res.header 'Pragma', 'no-cache'
  res.header 'Cache-Control', 'private, no-cache, no-store, must-revalidate'
  res.header 'Expires', 'Mon, 01 Jan 1990 00:00:00 GMT'
  res.header 'X-Frame-Options', 'SAMEORIGIN'
  res.header 'X-Content-Type-Options', 'nosniff'
  res.header 'X-XSS-Protection', '1; mode=block'
  res.header "Access-Control-Allow-Origin", Config.domain
  res.header "Access-Control-Allow-Methods", "GET, POST"
  res.header "Access-Control-Allow-Headers", "X-Requested-With, Accept, Authorization"
  next()
app.use logger('dev')
app.use bodyParser.json(Config.bodyParser.json)
app.use bodyParser.urlencoded(Config.bodyParser.urlencoded)
app.use cookieParser()
app.use express.static("../client/public")

app.disable 'x-powered-by'
server.listen Config.port

module.exports = app
