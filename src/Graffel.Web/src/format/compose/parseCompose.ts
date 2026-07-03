// Parse a docker-compose file into a small, Graffel-shaped model. Pure and
// unit-tested. YAML tokenizing is delegated to the `yaml` package so this module
// only concerns itself with compose *semantics* (services, depends_on, ports).
//
// The first step of the "living diagrams" pipeline (ADR-0016): compose text →
// ComposeModel → buildComposeGraph → ELK → a diagram you can keep in sync.

import { parse as parseYaml } from 'yaml'

export interface ComposeService {
  name: string
  /** Prebuilt image reference (e.g. 'postgres:15'), if any. */
  image?: string
  /** True when the service builds a local image (a `build:` section) rather than pulling one. */
  build: boolean
  /** Names of services this one depends on (both list and map forms normalized). */
  dependsOn: string[]
  /** Published port mappings as strings ('8080:80'). */
  ports: string[]
  /** Networks the service is attached to. */
  networks: string[]
}

export interface ComposeModel {
  services: ComposeService[]
  /** Named networks declared at the top level. */
  networks: string[]
}

/** Normalize a compose value that may be a scalar, a list, or a map, to string keys/items. */
function toStringList(value: unknown): string[] {
  if (value == null) return []
  if (Array.isArray(value)) return value.map((v) => String(v))
  if (typeof value === 'object') return Object.keys(value as Record<string, unknown>)
  return [String(value)]
}

export function parseCompose(text: string): ComposeModel {
  let doc: unknown
  try {
    doc = parseYaml(text)
  } catch (err) {
    throw new Error(`Not valid YAML: ${(err as Error).message}`, { cause: err })
  }
  if (!doc || typeof doc !== 'object') {
    throw new Error('No services found — this doesn’t look like a docker-compose file')
  }
  const root = doc as Record<string, unknown>
  const rawServices = root.services
  if (!rawServices || typeof rawServices !== 'object' || Array.isArray(rawServices)) {
    throw new Error('No services found in the compose file')
  }

  const services: ComposeService[] = Object.entries(rawServices as Record<string, unknown>).map(
    ([name, raw]) => {
      const svc = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
      const image = typeof svc.image === 'string' ? svc.image : undefined
      return {
        name,
        image,
        build: svc.build != null,
        dependsOn: toStringList(svc.depends_on),
        ports: toStringList(svc.ports),
        networks: toStringList(svc.networks),
      }
    },
  )

  if (services.length === 0) {
    throw new Error('No services found in the compose file')
  }

  const networks =
    root.networks && typeof root.networks === 'object' && !Array.isArray(root.networks)
      ? Object.keys(root.networks as Record<string, unknown>)
      : toStringList(root.networks)

  return { services, networks }
}
