const Redis = require("ioredis");

const port = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379;
const host = process.env.REDIS_HOST || "127.0.0.1";
const password = process.env.REDIS_PASSWORD || undefined;

const options = {
  host,
  port,
  password,
};

// Enable TLS if using Upstash or external secured service
if (host.includes("upstash.io") || process.env.REDIS_TLS === 'true') {
  options.tls = {};
}

const redis = new Redis(options);

redis.on("connect", () => {
  console.log("✅ Redis connected");
});

redis.on("error", (err) => {
  console.error("❌ Redis error:", err.message);
});

module.exports = redis;