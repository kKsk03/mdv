const packageName = '@mdv-ui/mdv'
const versionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/

function compareTags(left, right) {
  const leftParts = left.slice(1).split('.').map(Number)
  const rightParts = right.slice(1).split('.').map(Number)
  for (let index = 0; index < leftParts.length; index++) {
    const difference = leftParts[index] - rightParts[index]
    if (difference) return difference
  }
  return 0
}

export async function finalizeReleases({
  github,
  owner,
  repo,
  version = '',
  fetchImpl = fetch,
  log = console.log,
}) {
  const requestedVersion = version.trim()
  if (requestedVersion && !versionPattern.test(requestedVersion)) {
    throw new Error(`Invalid release version: ${requestedVersion}`)
  }

  const repository = { owner, repo }
  const tags = await github.paginate(github.rest.repos.listTags, {
    ...repository,
    per_page: 100,
  })
  const candidates = tags
    .map((tag) => tag.name)
    .filter((tag) => tag.startsWith('v') && versionPattern.test(tag.slice(1)))
    .filter((tag) => !requestedVersion || tag === `v${requestedVersion}`)
    .sort(compareTags)

  if (requestedVersion && candidates.length === 0) {
    throw new Error(`Missing version tag: v${requestedVersion}`)
  }

  const result = { created: [], waiting: [], existing: [], skipped: [] }
  if (candidates.length === 0) {
    log('No stable version tags to finalize.')
    return result
  }

  const releases = await github.paginate(github.rest.repos.listReleases, {
    ...repository,
    per_page: 100,
  })
  const existingTags = new Set(releases.map((release) => release.tag_name))
  const pendingTags = candidates.filter((tag) => {
    if (!existingTags.has(tag)) return true
    result.existing.push(tag)
    log(`${tag} already has a GitHub Release; leaving it unchanged.`)
    return false
  })
  if (pendingTags.length === 0) return result

  const response = await fetchImpl(
    `https://registry.npmjs.org/${encodeURIComponent(packageName)}`,
    {
      headers: { Accept: 'application/vnd.npm.install-v1+json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(20000),
    },
  )
  if (!response.ok && response.status !== 404) {
    throw new Error(`Could not read the npm registry: HTTP ${response.status}`)
  }

  const metadata = response.status === 404 ? null : await response.json()
  if (metadata && (metadata.name !== packageName || !metadata.versions)) {
    throw new Error(`Unexpected npm metadata for ${packageName}`)
  }

  for (const tag of pendingTags) {
    const tagVersion = tag.slice(1)
    const published = metadata?.versions[tagVersion]
    if (
      published?.name !== packageName ||
      published.version !== tagVersion ||
      !published.dist?.tarball
    ) {
      if (requestedVersion) {
        throw new Error(`${packageName}@${tagVersion} is not publicly available on npm yet.`)
      }
      result.waiting.push(tag)
      log(`${tag} is not publicly available on npm yet; a later run will check again.`)
      continue
    }

    const { data } = await github.rest.repos.getContent({
      ...repository,
      path: 'package.json',
      ref: tag,
    })
    if (data.type !== 'file' || data.encoding !== 'base64') {
      throw new Error(`Could not read package.json at ${tag}`)
    }
    const manifest = JSON.parse(Buffer.from(data.content, 'base64').toString('utf8'))
    if (manifest.name !== packageName || manifest.version !== tagVersion) {
      if (requestedVersion) throw new Error(`Package name or version does not match ${tag}`)
      result.skipped.push(tag)
      log(`${tag} does not match ${packageName}@${tagVersion}; skipping this tag.`)
      continue
    }

    try {
      await github.rest.repos.createRelease({
        ...repository,
        tag_name: tag,
        name: tag,
        generate_release_notes: true,
        draft: false,
        prerelease: false,
        make_latest: metadata['dist-tags']?.latest === tagVersion ? 'true' : 'false',
      })
    } catch (error) {
      if (error.status !== 422) throw error
      try {
        await github.rest.repos.getReleaseByTag({ ...repository, tag })
      } catch {
        throw error
      }
      result.existing.push(tag)
      log(`${tag} was finalized concurrently; leaving the existing Release unchanged.`)
      continue
    }

    result.created.push(tag)
    log(`Created the GitHub Release for ${tag}.`)
  }

  return result
}
