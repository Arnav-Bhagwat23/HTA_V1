import type { RedisOptions } from 'ioredis';

const DEFAULT_REDIS_URL = 'redis://localhost:6379';

const getRedisUrl = (): URL => {
  const rawUrl = process.env.REDIS_URL?.trim() || DEFAULT_REDIS_URL;
  return new URL(rawUrl);
};

const parseRedisDb = (pathname: string): number | undefined => {
  if (!pathname || pathname === '/') {
    return undefined;
  }

  const parsed = Number(pathname.slice(1));
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
};

export const getRedisConnection = (): RedisOptions => {
  const redisUrl = getRedisUrl();

  return {
    host: redisUrl.hostname,
    port: Number(redisUrl.port || 6379),
    username: redisUrl.username || undefined,
    password: redisUrl.password || undefined,
    db: parseRedisDb(redisUrl.pathname),
    maxRetriesPerRequest: null,
  };
};
