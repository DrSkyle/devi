
/**
 * Devi P2P Signaling Server
 * Deploy this to any Node.js host (Render, Fly.io, Railway, Glitch, Heroku)
 *
 * commands:
 *   npm install ws
 *   node server.js
 */

import { WebSocketServer } from 'ws'
import { createServer } from 'http'

const port = process.env.PORT || 4444
const server = createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' })
  response.end('Devi Signaling Server OK')
})

const wss = new WebSocketServer({ server })

// Global room state
const topics = new Map()

wss.on('connection', (conn, req) => {
  let closed = false
  // Check if topics are specified in URL
  // url format: /topic-name
  const url = new URL(req.url, 'http://localhost')
  const topicName = url.pathname.slice(1) || 'global-lobby'

  console.log(`Peer connected to topic: ${topicName}`)

  if (!topics.has(topicName)) {
    topics.set(topicName, new Set())
  }
  const topic = topics.get(topicName)
  topic.add(conn)

  conn.on('message', (message) => {
    if (closed) return
    const msg = JSON.parse(message)
    // Broadcast to all other peers in the topic
    topic.forEach(peer => {
      if (peer !== conn) {
        if (peer.readyState === 1) { // OPEN
            peer.send(message)
        }
      }
    })
  })

  conn.on('close', () => {
    closed = true
    topic.delete(conn)
    if (topic.size === 0) {
      topics.delete(topicName)
    }
    console.log(`Peer disconnected from ${topicName}`)
  })
})

server.listen(port, () => {
  console.log(`Signaling server running on port ${port}`)
})
