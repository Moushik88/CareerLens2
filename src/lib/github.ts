export interface GithubProfileSignal {
  publicRepos: number
  followers: number
  languages: string[]
  languageCounts: Record<string, number>
  recentActivityScore: number
  bioSkills: string[]
  repoProof: string[]
  stars: number
  readmeQualityHits: number
  skillRepoHits: Record<string, number>
}

const SKILL_KEYWORDS: Record<string, string[]> = {
  python: ['python', 'django', 'flask', 'fastapi', 'pandas', 'numpy'],
  javascript: ['javascript', 'js', 'node', 'express'],
  typescript: ['typescript', 'ts'],
  react: ['react', 'next', 'jsx', 'tsx'],
  'machine learning': ['machine-learning', 'ml', 'scikit', 'sklearn', 'xgboost'],
  tensorflow: ['tensorflow', 'tf-', 'keras'],
  pytorch: ['pytorch', 'torch'],
  sql: ['sql', 'postgres', 'mysql', 'sqlite'],
  docker: ['docker', 'dockerfile', 'compose'],
  aws: ['aws', 'lambda', 's3', 'ec2'],
  java: ['java', 'spring'],
  'deep learning': ['deep-learning', 'neural', 'cnn', 'transformer'],
  deployment: ['deploy', 'fastapi', 'flask-api', 'docker', 'vercel'],
  html: ['html'],
  css: ['css', 'tailwind'],
  git: ['git'],
}

export async function fetchGithubSignals(
  username: string,
): Promise<GithubProfileSignal | null> {
  try {
    const userRes = await fetch(`https://api.github.com/users/${username}`)
    if (!userRes.ok) return null
    const user = (await userRes.json()) as {
      public_repos: number
      followers: number
      bio?: string
    }

    const reposRes = await fetch(
      `https://api.github.com/users/${username}/repos?per_page=40&sort=updated`,
    )
    const repos = reposRes.ok
      ? ((await reposRes.json()) as Array<{
          name: string
          description: string | null
          language: string | null
          stargazers_count: number
          forks_count: number
          updated_at: string
          fork: boolean
          size: number
        }>)
      : []

    const ownRepos = repos.filter((r) => !r.fork)
    const languageCounts: Record<string, number> = {}
    const repoProof: string[] = []
    const skillRepoHits: Record<string, number> = {}
    let stars = 0
    let readmeQualityHits = 0

    for (const repo of ownRepos) {
      stars += repo.stargazers_count ?? 0
      if (repo.language) {
        const lang = repo.language.toLowerCase()
        languageCounts[lang] = (languageCounts[lang] ?? 0) + 1
      }

      const blob = `${repo.name} ${repo.description ?? ''}`.toLowerCase()
      if ((repo.description && repo.description.length > 40) || repo.size > 500) {
        readmeQualityHits += 1
      }

      repoProof.push(
        `${repo.name}${repo.language ? ` (${repo.language})` : ''}${
          repo.stargazers_count ? ` · ${repo.stargazers_count}★` : ''
        }`,
      )

      for (const [skill, keys] of Object.entries(SKILL_KEYWORDS)) {
        if (keys.some((k) => blob.includes(k)) || repo.language?.toLowerCase() === skill) {
          skillRepoHits[skill] = (skillRepoHits[skill] ?? 0) + 1
        }
      }
      if (repo.language) {
        const lang = repo.language.toLowerCase()
        skillRepoHits[lang] = (skillRepoHits[lang] ?? 0) + 1
      }
    }

    const languages = Object.entries(languageCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([lang]) => lang)
      .slice(0, 10)

    const now = Date.now()
    const recent = ownRepos.filter(
      (r) => now - new Date(r.updated_at).getTime() < 1000 * 60 * 60 * 24 * 120,
    ).length
    const recentActivityScore = Math.min(
      100,
      Math.round(
        (recent / Math.max(ownRepos.length, 1)) * 55 +
          Math.min(ownRepos.length, 15) * 2 +
          Math.min(readmeQualityHits, 8) * 2,
      ),
    )

    return {
      publicRepos: user.public_repos ?? ownRepos.length,
      followers: user.followers ?? 0,
      languages,
      languageCounts,
      recentActivityScore,
      bioSkills: (user.bio ?? '').toLowerCase().split(/[^a-z0-9+.#/]+/).filter(Boolean),
      repoProof: repoProof.slice(0, 12),
      stars,
      readmeQualityHits,
      skillRepoHits,
    }
  } catch {
    return null
  }
}
