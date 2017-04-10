var hypercore = require('hypercore')
var events = require('events')
var inherits = require('inherits')
var swarm = require('discovery-swarm')
var swarmDefaults = require('datland-swarm-defaults')

function LogFeed (storage, key, options) {
  events.EventEmitter.call(this)
  this.feed = hypercore(storage, key, options)
  this.log = []
}

LogFeed.prototype.open = function (cb) {
  var self = this
  this.feed.ready(function () {
    self.feed.on('error', function (err) {
      self.emit('error', err)
    })
    self.key = self.feed.key
    console.log('reading from hypercore', self.key.toString('hex'))
    // if (self.feed.secretKey) console.log(self.feed.secretKey.toString('hex'))

    read()
  })

  function read () {
    var rs = self.feed.createReadStream({live: true})
    rs.on('data', function (record) {
      var item = JSON.parse(record)
      console.log('typeof item', typeof item)
      debugger
      if (typeof item === 'string') item = JSON.parse(item)
      self.log.push(item)
      self.emit('log', item)
    })

    self.swarm = swarm(swarmDefaults({
      id: self.feed.id,
      stream: function (peer) {
        return self.feed.replicate({live: true})
      }
    }))
    self.swarm.listen(0)
    self.swarm.join(self.feed.discoveryKey)

    self.swarm.on('connection', function (peer, type) {
      // console.log('got', peer, type)
      console.log('connected to', self.swarm.connections.length, 'peers')
      peer.on('close', function () {
        console.log('peer disconnected')
      })
    })

    cb()
  }
}

inherits(LogFeed, events.EventEmitter)


LogFeed.prototype.append = function (record) {
  this.feed.append(JSON.stringify(record))
}

module.exports = LogFeed
