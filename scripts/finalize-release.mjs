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

async function readTaggedFile(github, repository, tag, path) {
  const { data } = await github.rest.repos
    .getContent({ ...repository, path, ref: `refs/tags/${tag}` })
    .catch((error) => {
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`Could not read ${path} at ${tag}: ${message}`, { cause: error })
    })
  if (data.type !== 'file' || data.encoding !== 'base64' || typeof data.content !== 'string') {
    throw new Error(`Could not read ${path} at ${tag} as a UTF-8 file`)
  }
  return Buffer.from(data.content, 'base64').toString('utf8')
}

function releaseBody(changelog, tag, previousTag, { owner, repo }) {
  // Changesets writes flush-left version headings. Ignore nested headings and fenced examples.
  const versionHeading = `## ${tag.slice(1)}`
  const lines = changelog.split(/\r?\n/)
  let start = -1
  let end = lines.length
  let fence = ''
  for (const [index, line] of lines.entries()) {
    const marker = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line)
    if (fence) {
      if (
        marker &&
        marker[1][0] === fence[0] &&
        marker[1].length >= fence.length &&
        !marker[2].trim()
      ) {
        fence = ''
      }
      continue
    }
    if (marker) {
      fence = marker[1]
      continue
    }

    if (start === -1) {
      if (line.trimEnd() === versionHeading) start = index + 1
    } else if (/^#{1,2}(?:[ \t]|$)/.test(line)) {
      end = index
      break
    }
  }

  const notes = start === -1 ? '' : lines.slice(start, end).join('\n').trim()
  if (!notes) throw new Error(`Missing or empty release notes in CHANGELOG.md at ${tag}`)

  const body = `## What's Changed\n\n${notes}`
  if (!previousTag) return body
  const range = `${previousTag}...${tag}`
  return `${body}\n\n**Full Changelog**: [\`${range}\`](https://github.com/${owner}/${repo}/compare/${range})`
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
  const stableTags = tags
    .map((tag) => tag.name)
    .filter((tag) => tag.startsWith('v') && versionPattern.test(tag.slice(1)))
    .sort(compareTags)
  const candidates = stableTags.filter((tag) => !requestedVersion || tag === `v${requestedVersion}`)

  if (requestedVersion && candidates.length === 0) {
    throw new Error(`Missing version tag: v${requestedVersion}`)
  }

  const result = { created: [], existing: [], skipped: [] }
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

  const publishedTags = stableTags.filter((tag) => {
    const tagVersion = tag.slice(1)
    const published = metadata?.versions[tagVersion]
    return (
      published?.name === packageName && published.version === tagVersion && published.dist?.tarball
    )
  })
  const unpublished = pendingTags.filter((tag) => !publishedTags.includes(tag))
  if (unpublished.length > 0) {
    const versions = unpublished.map((tag) => `${packageName}@${tag.slice(1)}`).join(', ')
    throw new Error(
      `${versions} is not publicly available on npm yet. Publish and approve the package, then rerun the Finalize Release workflow.`,
    )
  }

  const plannedReleases = []
  for (const tag of pendingTags) {
    const tagVersion = tag.slice(1)
    const manifest = JSON.parse(await readTaggedFile(github, repository, tag, 'package.json'))
    if (manifest.name !== packageName || manifest.version !== tagVersion) {
      if (requestedVersion) throw new Error(`Package name or version does not match ${tag}`)
      result.skipped.push(tag)
      log(`${tag} does not match ${packageName}@${tagVersion}; skipping this tag.`)
      continue
    }

    const changelog = await readTaggedFile(github, repository, tag, 'CHANGELOG.md')
    const previousTag = publishedTags[publishedTags.indexOf(tag) - 1]
    plannedReleases.push({
      ...repository,
      tag_name: tag,
      name: tag,
      body: releaseBody(changelog, tag, previousTag, repository),
      generate_release_notes: false,
      draft: false,
      prerelease: false,
      make_latest: metadata['dist-tags']?.latest === tagVersion ? 'true' : 'false',
    })
  }

  for (const release of plannedReleases) {
    await github.rest.repos.createRelease(release)
    result.created.push(release.tag_name)
    log(`Created the GitHub Release for ${release.tag_name}.`)
  }

  return result
}
