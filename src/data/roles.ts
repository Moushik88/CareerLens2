export type RoleId =
  | 'frontend'
  | 'fullstack'
  | 'backend'
  | 'data'
  | 'ml'
  | 'design'
  | 'devops'

export interface TargetRole {
  id: RoleId
  title: string
  domain: string
  summary: string
  mustHave: string[]
  niceToHave: string[]
  proofSignals: string[]
}

export const TARGET_ROLES: TargetRole[] = [
  {
    id: 'frontend',
    title: 'Frontend Engineer',
    domain: 'Software Engineering',
    summary: 'Build polished product UI with modern web frameworks and accessibility-minded craft.',
    mustHave: ['javascript', 'typescript', 'react', 'html', 'css', 'git'],
    niceToHave: ['next.js', 'tailwind', 'testing', 'figma', 'accessibility'],
    proofSignals: ['github', 'portfolio', 'deployed apps'],
  },
  {
    id: 'fullstack',
    title: 'Full-Stack Developer',
    domain: 'Software Engineering',
    summary: 'Ship end-to-end features across UI, APIs, and data layers with measurable delivery.',
    mustHave: ['javascript', 'typescript', 'react', 'node.js', 'sql', 'git', 'rest api'],
    niceToHave: ['next.js', 'mongodb', 'postgresql', 'docker', 'aws'],
    proofSignals: ['github', 'portfolio', 'linkedin'],
  },
  {
    id: 'backend',
    title: 'Backend Engineer',
    domain: 'Software Engineering',
    summary: 'Design reliable APIs, data models, and services with strong engineering hygiene.',
    mustHave: ['python', 'java', 'node.js', 'sql', 'rest api', 'git', 'data structures'],
    niceToHave: ['docker', 'kubernetes', 'aws', 'postgresql', 'redis', 'system design'],
    proofSignals: ['github', 'open source', 'system design notes'],
  },
  {
    id: 'data',
    title: 'Data Analyst',
    domain: 'Data & Analytics',
    summary: 'Turn messy datasets into decisions with SQL, visualization, and clear storytelling.',
    mustHave: ['python', 'sql', 'excel', 'statistics', 'data visualization', 'pandas'],
    niceToHave: ['tableau', 'power bi', 'r', 'machine learning', 'etl'],
    proofSignals: ['github', 'portfolio dashboards', 'kaggle'],
  },
  {
    id: 'ml',
    title: 'ML / AI Engineer',
    domain: 'Artificial Intelligence',
    summary: 'Prototype models, evaluate them rigorously, and connect ML work to product outcomes.',
    mustHave: ['python', 'machine learning', 'numpy', 'pandas', 'statistics', 'git'],
    niceToHave: ['pytorch', 'tensorflow', 'nlp', 'deep learning', 'mlops', 'docker'],
    proofSignals: ['github', 'research notebooks', 'model demos'],
  },
  {
    id: 'design',
    title: 'Product Designer',
    domain: 'Design',
    summary: 'Craft product experiences with research-backed UI, systems thinking, and polished delivery.',
    mustHave: ['figma', 'ui design', 'ux research', 'prototyping', 'design systems'],
    niceToHave: ['illustration', 'motion', 'html', 'css', 'accessibility'],
    proofSignals: ['behance', 'figma', 'portfolio case studies'],
  },
  {
    id: 'devops',
    title: 'DevOps / Cloud Engineer',
    domain: 'Infrastructure',
    summary: 'Automate delivery pipelines and keep cloud systems observable, secure, and scalable.',
    mustHave: ['linux', 'docker', 'ci/cd', 'git', 'aws', 'networking'],
    niceToHave: ['kubernetes', 'terraform', 'python', 'monitoring', 'azure', 'gcp'],
    proofSignals: ['github', 'infrastructure repos', 'certifications'],
  },
]

export const SKILL_ALIASES: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  'react.js': 'react',
  'reactjs': 'react',
  'nextjs': 'next.js',
  'node': 'node.js',
  'nodejs': 'node.js',
  'express': 'node.js',
  'express.js': 'node.js',
  'postgres': 'postgresql',
  'mongo': 'mongodb',
  'sklearn': 'machine learning',
  'scikit-learn': 'machine learning',
  'ml': 'machine learning',
  'ai': 'machine learning',
  'powerbi': 'power bi',
  'ux': 'ux research',
  'ui': 'ui design',
  'dsa': 'data structures',
  'c++': 'c++',
  'c#': 'c#',
  'html5': 'html',
  'css3': 'css',
  'tailwindcss': 'tailwind',
  'rest': 'rest api',
  'apis': 'rest api',
  'api': 'rest api',
  'github actions': 'ci/cd',
  'jenkins': 'ci/cd',
  'amazon web services': 'aws',
  'ms excel': 'excel',
  'microsoft excel': 'excel',
}
