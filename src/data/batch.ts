import type { BatchStudent } from '../lib/types'

export const BATCH_STUDENTS: BatchStudent[] = [
  {
    id: 's1',
    name: 'Aisha Rahman',
    branch: 'CSE',
    targetRole: 'Full-Stack Developer',
    readinessScore: 78,
    roleFit: 82,
    topGap: 'Docker',
    skills: ['javascript', 'typescript', 'react', 'node.js', 'sql'],
    verifiedSkills: 9,
    claimedSkills: 12,
    trend: 'up',
  },
  {
    id: 's2',
    name: 'Rohan Mehta',
    branch: 'CSE',
    targetRole: 'Backend Engineer',
    readinessScore: 71,
    roleFit: 74,
    topGap: 'System Design',
    skills: ['python', 'java', 'sql', 'rest api', 'git'],
    verifiedSkills: 8,
    claimedSkills: 11,
    trend: 'up',
  },
  {
    id: 's3',
    name: 'Diya Nair',
    branch: 'IT',
    targetRole: 'Frontend Engineer',
    readinessScore: 84,
    roleFit: 88,
    topGap: 'Testing',
    skills: ['javascript', 'typescript', 'react', 'html', 'css'],
    verifiedSkills: 10,
    claimedSkills: 11,
    trend: 'up',
  },
  {
    id: 's4',
    name: 'Kabir Singh',
    branch: 'CSE',
    targetRole: 'Data Analyst',
    readinessScore: 62,
    roleFit: 65,
    topGap: 'SQL storytelling',
    skills: ['python', 'sql', 'excel', 'pandas'],
    verifiedSkills: 6,
    claimedSkills: 10,
    trend: 'flat',
  },
  {
    id: 's5',
    name: 'Meera Iyer',
    branch: 'Design',
    targetRole: 'Product Designer',
    readinessScore: 80,
    roleFit: 85,
    topGap: 'Case study depth',
    skills: ['figma', 'ui design', 'ux research', 'prototyping'],
    verifiedSkills: 7,
    claimedSkills: 8,
    trend: 'up',
  },
  {
    id: 's6',
    name: 'Arjun Patel',
    branch: 'ECE',
    targetRole: 'ML / AI Engineer',
    readinessScore: 54,
    roleFit: 50,
    topGap: 'Model evaluation',
    skills: ['python', 'machine learning', 'pandas', 'numpy'],
    verifiedSkills: 5,
    claimedSkills: 11,
    trend: 'down',
  },
  {
    id: 's7',
    name: 'Sara Khan',
    branch: 'IT',
    targetRole: 'DevOps / Cloud Engineer',
    readinessScore: 67,
    roleFit: 70,
    topGap: 'Kubernetes',
    skills: ['linux', 'docker', 'git', 'aws'],
    verifiedSkills: 7,
    claimedSkills: 10,
    trend: 'flat',
  },
  {
    id: 's8',
    name: 'Vikram Rao',
    branch: 'CSE',
    targetRole: 'Full-Stack Developer',
    readinessScore: 49,
    roleFit: 42,
    topGap: 'Proof of work',
    skills: ['javascript', 'react', 'node.js'],
    verifiedSkills: 3,
    claimedSkills: 13,
    trend: 'down',
  },
  {
    id: 's9',
    name: 'Ananya Bose',
    branch: 'CSE',
    targetRole: 'Frontend Engineer',
    readinessScore: 73,
    roleFit: 76,
    topGap: 'Accessibility',
    skills: ['javascript', 'react', 'css', 'html', 'figma'],
    verifiedSkills: 8,
    claimedSkills: 9,
    trend: 'up',
  },
  {
    id: 's10',
    name: 'Neil Fernandes',
    branch: 'IT',
    targetRole: 'Backend Engineer',
    readinessScore: 58,
    roleFit: 60,
    topGap: 'API design',
    skills: ['python', 'sql', 'node.js', 'git'],
    verifiedSkills: 5,
    claimedSkills: 9,
    trend: 'flat',
  },
]

export function batchInsights(students: BatchStudent[]) {
  if (students.length === 0) {
    return {
      avg: 0,
      ready: 0,
      atRisk: 0,
      claimGap: 0,
      topGaps: [] as [string, number][],
      roleAverages: [] as { role: string; avg: number; count: number }[],
    }
  }

  const avg = Math.round(
    students.reduce((sum, s) => sum + s.readinessScore, 0) / students.length,
  )
  const ready = students.filter((s) => s.readinessScore >= 75).length
  const atRisk = students.filter((s) => s.readinessScore < 55).length
  const claimGap = students.filter(
    (s) => s.claimedSkills - s.verifiedSkills >= 4,
  ).length

  const gapCounts = new Map<string, number>()
  for (const s of students) {
    gapCounts.set(s.topGap, (gapCounts.get(s.topGap) ?? 0) + 1)
  }
  const topGaps = [...gapCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const roleBuckets = new Map<string, number[]>()
  for (const s of students) {
    const arr = roleBuckets.get(s.targetRole) ?? []
    arr.push(s.readinessScore)
    roleBuckets.set(s.targetRole, arr)
  }
  const roleAverages = [...roleBuckets.entries()]
    .map(([role, scores]) => ({
      role,
      avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      count: scores.length,
    }))
    .sort((a, b) => b.avg - a.avg)

  return { avg, ready, atRisk, claimGap, topGaps, roleAverages }
}
