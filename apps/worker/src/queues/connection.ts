import { RedisOptions } from 'ioredis';

const getRedisUrl = (): URL => {
  const rawUrl = process.env.REDIS_URL?.trim() || 'redis://localhost:6379';
  return new URL(rawUrl);
};

export const getRedisConnection = (): RedisOptions => {
  const redisUrl = getRedisUrl();

  return {
    host: redisUrl.hostname,
    port: Number(redisUrl.port || 6379),
    username: redisUrl.username || undefined,
    password: redisUrl.password || undefined,
    db: redisUrl.pathname && redisUrl.pathname !== '/'
      ? Number(redisUrl.pathname.slice(1))
      : undefined,
    maxRetriesPerRequest: null,
  };
};
