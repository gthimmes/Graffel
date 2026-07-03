import { describe, expect, it } from 'vitest'
import { inferShapeId, normalizeImageName } from './inferShape'
import type { ComposeService } from './parseCompose'

function svc(partial: Partial<ComposeService>): ComposeService {
  return { name: 'x', build: false, dependsOn: [], ports: [], networks: [], ...partial }
}

describe('normalizeImageName', () => {
  it('strips registry path and tag/digest', () => {
    expect(normalizeImageName('postgres:15')).toBe('postgres')
    expect(normalizeImageName('bitnami/redis:latest')).toBe('redis')
    expect(normalizeImageName('docker.io/library/nginx')).toBe('nginx')
    expect(normalizeImageName('mongo@sha256:abcdef')).toBe('mongo')
  })
})

describe('inferShapeId', () => {
  const cases: Array<[string, string]> = [
    ['postgres:15', 'arch-core:database'],
    ['mysql:8', 'arch-core:database'],
    ['mariadb', 'arch-core:database'],
    ['mongo:7', 'arch-core:database'],
    ['redis:7-alpine', 'arch-core:cache'],
    ['memcached', 'arch-core:cache'],
    ['rabbitmq:3-management', 'arch-core:queue'],
    ['confluentinc/cp-kafka', 'arch-core:queue'],
    ['nats', 'arch-core:queue'],
    ['nginx:1.25', 'arch-core:api-gateway'],
    ['traefik:v3', 'arch-core:api-gateway'],
    ['minio/minio', 'arch-core:storage'],
    ['prom/prometheus', 'cloud:monitoring'],
    ['grafana/grafana', 'cloud:monitoring'],
  ]
  it.each(cases)('maps %s → %s', (image, expected) => {
    expect(inferShapeId(svc({ image }))).toBe(expected)
  })

  it('defaults an unknown image to a generic service', () => {
    expect(inferShapeId(svc({ image: 'my-org/orders-api:1.0' }))).toBe('arch-core:service')
  })

  it('treats a locally-built service (no image) as a generic service', () => {
    expect(inferShapeId(svc({ build: true }))).toBe('arch-core:service')
  })
})
