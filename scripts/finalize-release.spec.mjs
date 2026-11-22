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
  changelogs = {},
  registryStatus = 200,
} = {}) {
  const created = []
  const requests = []
  const contentRequests = []
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
        getContent: async ({ path, ref }) => {
          contentRequests.push({ path, ref })
          if (!ref.startsWith('refs/tags/')) throw new Error(`Unexpected contents ref: ${ref}`)
          const tag = ref.slice('refs/tags/'.length)
          const version = tag.slice(1)
          let content
          if (path === 'package.json') {
            content = JSON.stringify(manifests[tag] ?? { name: packageName, version })
          } else if (path === 'CHANGELOG.md') {
            if (changelogs[tag] === null) throw new Error('Not Found')
            content = changelogs[tag] ?? `# Changelog\n\n## ${version}\n\n- Fix for ${tag}.\n`
          } else {
            throw new Error(`Unexpected contents path: ${path}`)
          }
          return {
            data: {
              type: 'file',
              encoding: 'base64',
              content: Buffer.from(content).toString('base64'),
            },
          }
        },
        createRelease: async (input) => {
          created.push(input)
          return { data: input }
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
  return { run, created, requests, contentRequests }
}

describe('GitHub Release finalization', () => {
  it('backfills published version tags and leaves existing Releases unchanged', async () => {
    const { run, created, contentRequests } = setup({
      tags: ['v0.1.2', 'v0.1.1'],
      releases: ['v0.1.1'],
      published: ['0.1.1', '0.1.2'],
    })

    expect(await run()).toEqual({
      created: ['v0.1.2'],
      existing: ['v0.1.1'],
      skipped: [],
    })
    expect(contentRequests).toEqual([
      { path: 'package.json', ref: 'refs/tags/v0.1.2' },
      { path: 'CHANGELOG.md', ref: 'refs/tags/v0.1.2' },
    ])
    expect(created).toEqual([
      {
        owner: 'kKsk03',
        repo: 'mdv',
        tag_name: 'v0.1.2',
        name: 'v0.1.2',
        body: [
          "## What's Changed",
          '',
          '- Fix for v0.1.2.',
          '',
          '**Full Changelog**: [`v0.1.1...v0.1.2`](https://github.com/kKsk03/mdv/compare/v0.1.1...v0.1.2)',
        ].join('\n'),
        generate_release_notes: false,
        draft: false,
        prerelease: false,
        make_latest: 'true',
      },
    ])
  })

  it('reads only the exact version section and preserves Markdown examples', async () => {
    const notes = [
      '### Minor Changes',
      '',
      '- Add a configurable example.',
      '',
      '  ## Example title',
      '',
      '~~~md',
      '## Heading shown in the example',
      '~~~',
      '',
      '### Patch Changes',
      '',
      '- Fix keyboard navigation.',
    ].join('\n')
    const changelog = [
      '# Changelog',
      '',
      '## 0.1.20',
      '',
      '- A different release.',
      '',
      '```md',
      '## 0.1.2',
      '- Not a release section.',
      '```',
      '',
      '## 0.1.2',
      '',
      notes.replaceAll('\n', '\r\n'),
      '',
      '## 0.1.1',
      '',
      '- An older release.',
    ].join('\r\n')
    const { run, created } = setup({ changelogs: { 'v0.1.2': changelog } })

    await run()
    expect(created[0].body).toBe(`## What's Changed\n\n${notes}`)
  })

  it.each([
    [null, 'Could not read CHANGELOG.md at v0.1.3'],
    ['## 0.1.2\n\n- Older release.', 'Missing or empty release notes in CHANGELOG.md at v0.1.3'],
    [
      '## 0.1.3\n\n## 0.1.2\n\n- Older release.',
      'Missing or empty release notes in CHANGELOG.md at v0.1.3',
    ],
  ])(
    'fails before creating any Release when tagged notes are unavailable (%j)',
    async (changelog, error) => {
      const { run, created } = setup({
        tags: ['v0.1.2', 'v0.1.3'],
        published: ['0.1.2', '0.1.3'],
        changelogs: { 'v0.1.3': changelog },
      })

      await expect(run()).rejects.toThrow(error)
      expect(created).toEqual([])
    },
  )

  it('fails before creating any Release when one candidate is not public', async () => {
    const { run, created, contentRequests } = setup({
      tags: ['v0.1.3', 'v0.1.2'],
      published: ['0.1.2'],
    })

    await expect(run()).rejects.toThrow('@mdv-ui/mdv@0.1.3 is not publicly available on npm yet')
    expect(created).toEqual([])
    expect(contentRequests).toEqual([])
  })

  it('fails without creating a Release when the package is staged or metadata is absent', async () => {
    for (const configuration of [{ published: [] }, { registryStatus: 404 }]) {
      const { run, created, contentRequests } = setup(configuration)
      await expect(run()).rejects.toThrow('not publicly available on npm yet')
      expect(created).toEqual([])
      expect(contentRequests).toEqual([])
    }
  })

  it('does not mark an older backfilled version as latest', async () => {
    const { run, created } = setup({ latest: '0.2.0' })
    await run()
    expect(created[0].make_latest).toBe('false')
  })

  it('skips npm requests when every version already has a Release', async () => {
    const { run, created, requests, contentRequests } = setup({ releases: ['v0.1.2'] })
    expect(await run()).toEqual({ created: [], existing: ['v0.1.2'], skipped: [] })
    expect(created).toEqual([])
    expect(requests).toEqual([])
    expect(contentRequests).toEqual([])
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
      existing: [],
      skipped: ['v0.1.0'],
    })
    expect(created.map((release) => release.tag_name)).toEqual(['v0.1.2'])
  })

  it('limits a manual run to the requested published version', async () => {
    const { run, created } = setup({
      tags: ['v0.1.3', 'v0.1.1', 'v0.1.2'],
      published: ['0.1.1', '0.1.3'],
      latest: '0.1.3',
    })
    await run('0.1.3')
    expect(created.map((release) => release.tag_name)).toEqual(['v0.1.3'])
    expect(created[0].body).toContain('/compare/v0.1.1...v0.1.3')
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
})
