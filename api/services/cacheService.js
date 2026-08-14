const Redis = require('ioredis');

/**
 * Cache Service (Dual-Engine: Redis + In-Memory Fallback)
 * Provides ultra-fast caching with automatic graceful degradation.
 */
class InMemoryCache {
  constructor() {
    this.store = new Map();
  }

  get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  set(key, value, ttlSeconds = 300) {
    const expiresAt = ttlSeconds > 0 ? Date.now() + (ttlSeconds * 1000) : null;
    this.store.set(key, { value, expiresAt });
  }

  del(key) {
    return this.store.delete(key);
  }

  delPattern(pattern) {
    // Convert Redis glob-style pattern (e.g. "products:*") to RegExp
    const regexPattern = '^' + pattern.replace(/\*/g, '.*') + '$';
    const regex = new RegExp(regexPattern);
    let count = 0;
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  flush() {
    const size = this.store.size;
    this.store.clear();
    return size;
  }

  size() {
    // Clean expired items
    const now = Date.now();
    for (const [key, item] of this.store.entries()) {
      if (item.expiresAt && now > item.expiresAt) {
        this.store.delete(key);
      }
    }
    return this.store.size;
  }
}

class CacheService {
  constructor() {
    this.inMemory = new InMemoryCache();
    this.redisClient = null;
    this.isRedisReady = false;
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      dels: 0
    };

    this.init();
  }

  init() {
    const redisUrl = process.env.REDIS_URL;
    const redisHost = process.env.REDIS_HOST;
    const redisPort = process.env.REDIS_PORT || 6379;
    const redisPassword = process.env.REDIS_PASSWORD || undefined;

    // Only try to connect to Redis if explicitly configured
    if (redisUrl || redisHost) {
      try {
        const options = {
          lazyConnect: true,
          maxRetriesPerRequest: 1,
          connectTimeout: 2000,
          retryStrategy: (times) => {
            if (times > 3) {
              console.warn('⚠️ Redis reconnection limit reached. Operating in In-Memory mode.');
              return null; // Stop retrying, use fallback
            }
            return Math.min(times * 1000, 3000);
          }
        };

        if (redisUrl) {
          this.redisClient = new Redis(redisUrl, options);
        } else {
          this.redisClient = new Redis({
            host: redisHost,
            port: Number(redisPort),
            password: redisPassword,
            ...options
          });
        }

        this.redisClient.on('connect', () => {
          this.isRedisReady = true;
          console.log('⚡ Redis Cache connected successfully.');
        });

        this.redisClient.on('ready', () => {
          this.isRedisReady = true;
        });

        this.redisClient.on('error', (err) => {
          if (this.isRedisReady) {
            console.warn('⚠️ Redis error:', err.message);
          }
          this.isRedisReady = false;
        });

        this.redisClient.on('close', () => {
          this.isRedisReady = false;
        });

        // Attempt non-blocking connection
        this.redisClient.connect().catch(() => {
          this.isRedisReady = false;
          console.log('ℹ️ Redis not reachable. Falling back to high-performance In-Memory Cache.');
        });
      } catch (e) {
        this.isRedisReady = false;
        console.log('ℹ️ Operating in In-Memory Cache mode.');
      }
    } else {
      console.log('ℹ️ Operating in In-Memory Cache mode (Redis not configured).');
    }
  }

  /**
   * Get cached value
   */
  async get(key) {
    try {
      if (this.isRedisReady && this.redisClient) {
        const data = await this.redisClient.get(key);
        if (data !== null) {
          this.stats.hits++;
          return JSON.parse(data);
        }
      } else {
        const data = this.inMemory.get(key);
        if (data !== null && data !== undefined) {
          this.stats.hits++;
          return data;
        }
      }
      this.stats.misses++;
      return null;
    } catch (err) {
      // Fallback to in-memory on redis read error
      const fallback = this.inMemory.get(key);
      if (fallback !== null && fallback !== undefined) {
        this.stats.hits++;
        return fallback;
      }
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Set cached value with TTL in seconds
   */
  async set(key, value, ttlSeconds = 300) {
    this.stats.sets++;
    // Always update in-memory cache as immediate fallback
    this.inMemory.set(key, value, ttlSeconds);

    if (this.isRedisReady && this.redisClient) {
      try {
        const serialized = JSON.stringify(value);
        if (ttlSeconds > 0) {
          await this.redisClient.set(key, serialized, 'EX', ttlSeconds);
        } else {
          await this.redisClient.set(key, serialized);
        }
      } catch (err) {
        console.warn('⚠️ Failed to set Redis cache key:', key, err.message);
      }
    }
  }

  /**
   * Delete specific key
   */
  async del(key) {
    this.stats.dels++;
    this.inMemory.del(key);
    if (this.isRedisReady && this.redisClient) {
      try {
        await this.redisClient.del(key);
      } catch (err) {
        console.warn('⚠️ Failed to delete Redis key:', key, err.message);
      }
    }
  }

  /**
   * Delete keys matching a pattern (e.g. "products:*", "settings:*")
   */
  async delPattern(pattern) {
    this.stats.dels++;
    const inMemCount = this.inMemory.delPattern(pattern);

    if (this.isRedisReady && this.redisClient) {
      try {
        const stream = this.redisClient.scanStream({
          match: pattern,
          count: 100
        });

        stream.on('data', async (keys) => {
          if (keys.length) {
            const pipeline = this.redisClient.pipeline();
            keys.forEach((k) => pipeline.del(k));
            await pipeline.exec();
          }
        });
      } catch (err) {
        console.warn('⚠️ Failed to delete Redis pattern:', pattern, err.message);
      }
    }

    return inMemCount;
  }

  /**
   * Flush all cache keys
   */
  async flush() {
    this.inMemory.flush();
    if (this.isRedisReady && this.redisClient) {
      try {
        await this.redisClient.flushdb();
      } catch (err) {
        console.warn('⚠️ Failed to flush Redis:', err.message);
      }
    }
    return true;
  }

  /**
   * Express Middleware for caching GET routes
   */
  middleware(keyPrefix, ttlSeconds = 300) {
    return async (req, res, next) => {
      // Only cache GET requests
      if (req.method !== 'GET') {
        return next();
      }

      // Skip cache for authorized admin requests if requested
      if (req.headers.authorization && req.query.admin === 'true') {
        return next();
      }

      const cacheKey = `${keyPrefix}:${req.originalUrl || req.url}`;

      try {
        const cachedData = await this.get(cacheKey);
        if (cachedData !== null) {
          res.setHeader('X-Cache', 'HIT');
          res.setHeader('X-Cache-Engine', this.isRedisReady ? 'Redis' : 'In-Memory');
          return res.json(cachedData);
        }

        // Intercept res.json to populate cache
        res.setHeader('X-Cache', 'MISS');
        res.setHeader('X-Cache-Engine', this.isRedisReady ? 'Redis' : 'In-Memory');

        const originalJson = res.json.bind(res);
        res.json = (body) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            this.set(cacheKey, body, ttlSeconds).catch(() => {});
          }
          return originalJson(body);
        };

        next();
      } catch (err) {
        next();
      }
    };
  }

  /**
   * Diagnostic Status
   */
  getStatus() {
    return {
      engine: this.isRedisReady ? 'Redis (Connected)' : 'In-Memory Cache (Active)',
      isRedisReady: this.isRedisReady,
      inMemoryKeyCount: this.inMemory.size(),
      stats: this.stats
    };
  }
}

module.exports = new CacheService();
