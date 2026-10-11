const Redis = require('ioredis');
let publisher;
let subscriber;
let attachedIo;
const CHANNEL = 'fleetdash:realtime';

async function initializeRedisPubSub(io) {
  if (!process.env.REDIS_URL && process.env.REDIS_ENABLED !== 'true') {
    console.warn('Redis Pub/Sub disabled: set REDIS_URL to enable multi-instance fan-out.');
    return false;
  }
  try {
    const options = process.env.REDIS_URL || {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: Number(process.env.REDIS_PORT || 6379),
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    };
    publisher = typeof options === 'string' ? new Redis(options, { lazyConnect: true }) : new Redis(options);
    subscriber = typeof options === 'string' ? new Redis(options, { lazyConnect: true }) : new Redis(options);
    await Promise.all([publisher.connect(), subscriber.connect()]);
    attachedIo = io;
    await subscriber.subscribe(CHANNEL);
    subscriber.on('message', (_channel, raw) => {
      try {
        const message = JSON.parse(raw);
        attachedIo.to(message.fleetId).emit(message.event, message.payload);
      } catch (error) { console.error('Invalid Redis telemetry message:', error.message); }
    });
    console.log('Redis Pub/Sub connected');
    return true;
  } catch (error) {
    console.error('Redis unavailable; using local Socket.IO fan-out:', error.message);
    if (publisher) publisher.disconnect();
    if (subscriber) subscriber.disconnect();
    publisher = subscriber = null;
    return false;
  }
}

async function publishRealtimeEvent(io, fleetId, event, payload) {
  if (publisher && publisher.status === 'ready') {
    try {
      await publisher.publish(CHANNEL, JSON.stringify({ fleetId, event, payload }));
      return;
    } catch (error) {
      console.error('Redis publish failed; falling back to local delivery:', error.message);
    }
  }
  io.to(fleetId).emit(event, payload);
}
async function closeRedisPubSub() {
  await Promise.all([publisher?.quit().catch(() => {}), subscriber?.quit().catch(() => {})]);
}
module.exports = { initializeRedisPubSub, publishRealtimeEvent, closeRedisPubSub };
