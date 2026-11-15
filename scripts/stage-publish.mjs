import { appendFileSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))

if (packageJson.name !== '@mdv-ui/mdv') {
  throw new Error(`Unexpected package name: ${packageJson.name}`)
}

if (!/^\d+\.\d+\.\d+$/.test(packageJson.version)) {
  throw new Error(`Invalid release version: ${packageJson.version}`)
}

const outputFile = process.env.CHANGESETS_OUTPUT
if (!outputFile) {
  throw new Error('CHANGESETS_OUTPUT is required by changesets/action')
}
appendFileSync(outputFile, '')

const tag = `v${packageJson.version}`
const existingTag = spawnSync('git', ['tag', '--list', tag], {
  encoding: 'utf8',
})

if (existingTag.error) throw existingTag.error
if (existingTag.status !== 0) {
  throw new Error(`Could not check whether ${tag} already exists`)
}

if (existingTag.stdout.trim() === tag) {
  console.log(`${tag} is already staged; skipping duplicate npm submission.`)
  process.exit(0)
}

const result = spawnSync('npm', ['stage', 'publish'], { stdio: 'inherit' })
if (result.error) throw result.error
if (result.status !== 0) process.exit(result.status ?? 1)

appendFileSync(
  outputFile,
  // changesets/action uses this event to tag the commit after npm accepts staging.
  `${JSON.stringify({ type: 'git-tag', tag, packageName: packageJson.name })}\n`,
)

console.log(`Staged ${packageJson.name}@${packageJson.version}.`)
