// Guess a Graffel shape from a compose service's image. Pure and unit-tested.
// The point of "living diagrams" is that the generated picture already reads like
// an architecture — a Postgres box looks like a database, Redis like a cache —
// so the mapping below is deliberately generous with well-known images and falls
// back to a plain service for anything it doesn't recognize (including your own
// locally-built apps).

import type { ComposeService } from './parseCompose'

const DEFAULT_SHAPE = 'arch-core:service'

/** Strip the registry path and the `:tag` / `@digest` suffix, leaving the bare image name. */
export function normalizeImageName(image: string): string {
  const lastSlash = image.lastIndexOf('/')
  const base = lastSlash >= 0 ? image.slice(lastSlash + 1) : image
  return base.split('@')[0].split(':')[0].toLowerCase()
}

// Ordered rules: first substring match wins. Kept as substrings so tagged/prefixed
// variants ('cp-kafka', 'redis-stack') still resolve.
const RULES: Array<{ keywords: string[]; shape: string }> = [
  { keywords: ['postgres', 'mysql', 'mariadb', 'mongo', 'cockroach', 'mssql', 'sqlserver', 'oracle', 'cassandra', 'elasticsearch', 'opensearch', 'influxdb', 'clickhouse', 'neo4j', 'couchdb', 'db2'], shape: 'arch-core:database' },
  { keywords: ['redis', 'memcached', 'keydb', 'valkey', 'hazelcast'], shape: 'arch-core:cache' },
  { keywords: ['rabbitmq', 'kafka', 'nats', 'activemq', 'pulsar', 'rocketmq', 'zeromq', 'mosquitto', 'redpanda'], shape: 'arch-core:queue' },
  { keywords: ['nginx', 'traefik', 'haproxy', 'envoy', 'kong', 'caddy', 'apache', 'httpd'], shape: 'arch-core:api-gateway' },
  { keywords: ['minio', 'localstack', 'ceph'], shape: 'arch-core:storage' },
  { keywords: ['prometheus', 'grafana', 'jaeger', 'kibana', 'datadog', 'loki', 'zipkin'], shape: 'cloud:monitoring' },
]

export function inferShapeId(service: ComposeService): string {
  if (!service.image) return DEFAULT_SHAPE
  const name = normalizeImageName(service.image)
  for (const rule of RULES) {
    if (rule.keywords.some((k) => name.includes(k))) return rule.shape
  }
  return DEFAULT_SHAPE
}
