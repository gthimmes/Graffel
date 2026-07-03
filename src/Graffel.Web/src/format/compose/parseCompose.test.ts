import { describe, expect, it } from 'vitest'
import { parseCompose } from './parseCompose'

describe('parseCompose', () => {
  it('reads services with image, ports and networks', () => {
    const model = parseCompose(`
services:
  web:
    image: nginx:1.25
    ports:
      - "8080:80"
    networks:
      - frontend
  db:
    image: postgres:15
networks:
  frontend: {}
`)
    expect(model.services.map((s) => s.name).sort()).toEqual(['db', 'web'])
    const web = model.services.find((s) => s.name === 'web')!
    expect(web.image).toBe('nginx:1.25')
    expect(web.ports).toEqual(['8080:80'])
    expect(web.networks).toEqual(['frontend'])
    expect(model.networks).toEqual(['frontend'])
  })

  it('reads depends_on in list form', () => {
    const model = parseCompose(`
services:
  web:
    image: node
    depends_on:
      - db
      - redis
  db:
    image: postgres
  redis:
    image: redis
`)
    const web = model.services.find((s) => s.name === 'web')!
    expect(web.dependsOn.sort()).toEqual(['db', 'redis'])
  })

  it('reads depends_on in the long map form (with conditions)', () => {
    const model = parseCompose(`
services:
  api:
    image: node
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_started
  db:
    image: postgres
  cache:
    image: redis
`)
    const api = model.services.find((s) => s.name === 'api')!
    expect(api.dependsOn.sort()).toEqual(['cache', 'db'])
  })

  it('marks a service with a build section (no prebuilt image)', () => {
    const model = parseCompose(`
services:
  app:
    build: .
  worker:
    build:
      context: ./worker
`)
    const app = model.services.find((s) => s.name === 'app')!
    const worker = model.services.find((s) => s.name === 'worker')!
    expect(app.build).toBe(true)
    expect(app.image).toBeUndefined()
    expect(worker.build).toBe(true)
  })

  it('coerces numeric ports and single-string forms to string arrays', () => {
    const model = parseCompose(`
services:
  web:
    image: nginx
    ports: "80:80"
  api:
    image: node
    ports:
      - 3000
`)
    expect(model.services.find((s) => s.name === 'web')!.ports).toEqual(['80:80'])
    expect(model.services.find((s) => s.name === 'api')!.ports).toEqual(['3000'])
  })

  it('throws a friendly error when there are no services', () => {
    expect(() => parseCompose('version: "3.9"')).toThrow(/no services/i)
    expect(() => parseCompose('not: valid: yaml: at: all')).toThrow()
  })
})
