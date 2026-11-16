// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { finalizeReleases } from './finalize-release.mjs'

const packageName = '@mdv-ui/mdv'

function setup({
  tags = ['v0.1.2'],
  releases = [],
  published = ['0.1.2'],
  latest = '0.1.2',
  manifests = {},
  registryStatus = 200,
  createError,
  concurrentRelease = false,
} = {}) {
  const created = []
  const requests = []
  const manifestRefs = []
  const listTags = () => {}
  const listReleases = () => {}
  const github = {
    paginate: async (method) => {
      if (method === listTags) return tags.map((name) => ({ name }))
      if (method === listReleases) return releases.map((tag_name) => ({ tag_name }))
      throw new Error('Unexpected pagination request')
    },
    rest: {
      repos: {
        listTags,
        listReleases,
        getContent: async ({ ref }) => {
          manifestRefs.push(ref)
          return {
            data: {
              type: 'file',
              encoding: 'base64',
              content: Buffer.from(
                JSON.stringify(manifests[ref] ?? { name: packageName, version: ref.slice(1) }),
              ).toString('base64'),
            },
          }
        },
        createRelease: async (input) => {
          if (createError) throw createError
          created.push(input)
          return { data: input }
        },
        getReleaseByTag: async () => {
          if (concurrentRelease) return { data: { tag_name: 'v0.1.2' } }
          throw Object.assign(new Error('Not found'), { status: 404 })
        },
      },
    },
  }
  const run = (version = '') =>
    finalizeReleases({
      github,
      owner: 'kKsk03',
      repo: 'mdv',
      version,
      log: () => {},
      fetchImpl: async (url) => {
        requests.push(url)
        return {
          ok: registryStatus === 200,
          status: registryStatus,
          json: async () => ({
            name: packageName,
            'dist-tags': { latest },
            versions: Object.fromEntries(
              published.map((entry) => [
                entry,
                {
                  name: packageName,
                  version: entry,
                  dist: { tarball: `https://registry.npmjs.org/tarballs/mdv-${entry}.tgz` },
                },
              ]),
            ),
          }),
        }
      },
    })
  return { run, created, requests, manifestRefs }
}

describe('GitHub Release finalization', () => {
  it('backfills published version tags and leaves existing Releases unchanged', async () => {
    const { run, created, manifestRefs } = setup({
      tags: ['v0.1.3', 'v0.1.2', 'v0.1.1'],
      releases: ['v0.1.1'],
      published: ['0.1.1', '0.1.2'],
    })

    expect(await run()).toEqual({
      created: ['v0.1.2'],
      waiting: ['v0.1.3'],
      existing: ['v0.1.1'],
      skipped: [],
    })
    expect(manifestRefs).toEqual(['v0.1.2'])
    expect(created).toEqual([
      {
        owner: 'kKsk03',
        repo: 'mdv',
        tag_name: 'v0.1.2',
        name: 'v0.1.2',
        generate_release_notes: true,
        draft: false,
        prerelease: false,
        make_latest: 'true',
      },
    ])
  })

  it('waits without creating a Release when the package is staged or metadata is absent', async () => {
    for (const configuration of [{ published: [] }, { registryStatus: 404 }]) {
      const { run, created, manifestRefs } = setup(configuration)
      expect(await run()).toEqual({ created: [], waiting: ['v0.1.2'], existing: [], skipped: [] })
      expect(created).toEqual([])
      expect(manifestRefs).toEqual([])
    }
  })

  it('does not mark an older backfilled version as latest', async () => {
    const { run, created } = setup({ latest: '0.2.0' })
    await run()
    expect(created[0].make_latest).toBe('false')
  })

  it('skips npm requests when every version already has a Release', async () => {
    const { run, created, requests } = setup({ releases: ['v0.1.2'] })
    expect(await run()).toEqual({ created: [], waiting: [], existing: ['v0.1.2'], skipped: [] })
    expect(created).toEqual([])
    expect(requests).toEqual([])
  })

  it('sorts stable tags numerically and ignores unrelated or prerelease tags', async () => {
    const { run, created } = setup({
      tags: ['v0.1.10', 'v0.2.0-beta.1', 'v0.1.2', 'preview', 'v01.0.0'],
      published: ['0.1.2', '0.1.10'],
      latest: '0.1.10',
    })
    await run()
    expect(created.map((release) => release.tag_name)).toEqual(['v0.1.2', 'v0.1.10'])
  })

  it('requires a matching package name and version at the existing tag', async () => {
    for (const manifest of [
      { name: 'another-package', version: '0.1.2' },
      { name: packageName, version: '0.1.1' },
    ]) {
      const { run, created } = setup({ manifests: { 'v0.1.2': manifest } })
      await expect(run('0.1.2')).rejects.toThrow('Package name or version does not match v0.1.2')
      expect(created).toEqual([])
    }
  })

  it('skips historical tags with a different package identity without blocking backfills', async () => {
    const { run, created } = setup({
      tags: ['v0.1.0', 'v0.1.2'],
      published: ['0.1.0', '0.1.2'],
      manifests: { 'v0.1.0': { name: 'previous-package', version: '0.1.0' } },
    })
    expect(await run()).toEqual({
      created: ['v0.1.2'],
      waiting: [],
      existing: [],
      skipped: ['v0.1.0'],
    })
    expect(created.map((release) => release.tag_name)).toEqual(['v0.1.2'])
  })

  it('limits a manual run to the requested published version', async () => {
    const { run, created } = setup({
      tags: ['v0.1.1', 'v0.1.2'],
      published: ['0.1.1', '0.1.2'],
    })
    await run('0.1.2')
    expect(created.map((release) => release.tag_name)).toEqual(['v0.1.2'])
  })

  it('rejects invalid, untagged, or unpublished manually requested versions', async () => {
    await expect(setup().run('v0.1.2')).rejects.toThrow('Invalid release version')
    await expect(setup().run('0.1.3')).rejects.toThrow('Missing version tag')
    const { run, created } = setup({ published: [] })
    await expect(run('0.1.2')).rejects.toThrow('not publicly available on npm yet')
    expect(created).toEqual([])
  })

  it('reports registry failures rather than treating them as pending approval', async () => {
    const { run, created } = setup({ registryStatus: 503 })
    await expect(run()).rejects.toThrow('Could not read the npm registry: HTTP 503')
    expect(created).toEqual([])
  })

  it('accepts concurrent creation without hiding other GitHub errors', async () => {
    const validationError = Object.assign(new Error('Validation failed'), { status: 422 })
    const concurrent = setup({ createError: validationError, concurrentRelease: true })
    expect(await concurrent.run()).toEqual({
      created: [],
      waiting: [],
      existing: ['v0.1.2'],
      skipped: [],
    })
    await expect(setup({ createError: validationError }).run()).rejects.toBe(validationError)
    const permissionError = Object.assign(new Error('Forbidden'), { status: 403 })
    await expect(setup({ createError: permissionError }).run()).rejects.toBe(permissionError)
  })
})
