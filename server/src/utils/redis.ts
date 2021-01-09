import { RedisPubSub } from 'graphql-redis-subscriptions';
import * as Redis from 'ioredis';

const options = {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  retryStrategy: times => {
    // reconnect after
    return Math.min(times * 50, 2000);
  }
} as Redis.RedisOptions;

export const redis = new Redis(options);
export const pubsub = new RedisPubSub({
  publisher: redis,
  subscriber: redis,
});
