export type ResourceKind = 'test' | 'video' | 'notes' | 'link'

export interface SubjectResource {
  id: string
  kind: ResourceKind
  title: string
  description: string
  href: string
  external?: boolean
  comingSoon?: boolean
}

export interface SubjectRecording {
  slug: string
  name: string
  details: string
  href?: string
}

export interface Subject {
  slug: string
  name: string
  shortName: string
  description: string
  resources: SubjectResource[]
  recordings: SubjectRecording[]
}

const YOUTUBE_CHANNEL = 'https://www.youtube.com/@beyondtheformulatutoring'

export function topicRecordingUrl(topicName: string, youtubeUrl?: string | null) {
  if (youtubeUrl) return youtubeUrl
  return `${YOUTUBE_CHANNEL}/search?query=${encodeURIComponent(topicName)}`
}

export const RESOURCE_KIND_LABELS: Record<ResourceKind, string> = {
  test: 'Practice tests',
  video: 'Video lessons',
  notes: 'Worksheets & notes',
  link: 'Links & tools',
}

export const SUBJECTS: Subject[] = [
  {
    slug: 'precal',
    name: 'Precalculus',
    shortName: 'PreCal',
    description:
      'Functions, trigonometry, polynomials, and AP Precalculus prep — free sessions and open resources.',
    recordings: [
      {
        slug: 'functions',
        name: 'Functions',
        details: 'Function families, transformations, inverses, and composition.',
      },
      {
        slug: 'trigonometry',
        name: 'Trigonometry',
        details: 'Unit circle, identities, graphs, and solving trig equations.',
      },
      {
        slug: 'polynomials',
        name: 'Polynomials',
        details: 'Zeros, factoring, end behavior, and rational functions.',
      },
      {
        slug: 'exponents-logs',
        name: 'Exponents & logs',
        details: 'Exponential growth and decay, log laws, and solving equations.',
      },
      {
        slug: 'sequences-series',
        name: 'Sequences & series',
        details: 'Arithmetic and geometric sequences, sigma notation, and series.',
      },
      {
        slug: 'conic-sections',
        name: 'Conic sections',
        details: 'Circles, ellipses, parabolas, and hyperbolas.',
      },
      {
        slug: 'limits-intro-calculus',
        name: 'Limits & intro calculus',
        details: 'Limits, continuity, and a first look at derivatives.',
      },
    ],
    resources: [
      {
        id: 'precal-unit1',
        kind: 'test',
        title: 'AP Precalculus — Unit 1',
        description:
          '40-question interactive assessment with per-question feedback and a question navigator.',
        href: '/students/precal/tests/unit-1',
      },
      {
        id: 'precal-youtube',
        kind: 'video',
        title: 'Beyond The Formula YouTube',
        description: 'Free recorded lessons and walkthroughs for precalculus topics.',
        href: 'https://www.youtube.com/@beyondtheformulatutoring',
        external: true,
      },
      {
        id: 'precal-topics',
        kind: 'notes',
        title: 'Curated topic list',
        description:
          'Functions, trigonometry, polynomials, exponents & logs, sequences, conics, and limits.',
        href: '/students/precal/schedule',
      },
      {
        id: 'precal-stuck',
        kind: 'link',
        title: 'Stuck points forum',
        description: 'Post a question on a curated topic — mentors and peers can help.',
        href: '/stuck',
      },
    ],
  },
]

export const COMING_SOON_SUBJECTS = [
  { slug: 'algebra', name: 'Algebra' },
  { slug: 'calculus', name: 'Calculus' },
  { slug: 'sat', name: 'SAT' },
]

export function getSubject(slug: string | undefined | null): Subject | undefined {
  if (!slug) return undefined
  return SUBJECTS.find((s) => s.slug === slug)
}

export function resourcesByKind(subject: Subject): Record<ResourceKind, SubjectResource[]> {
  const grouped: Record<ResourceKind, SubjectResource[]> = {
    test: [],
    video: [],
    notes: [],
    link: [],
  }
  for (const r of subject.resources) {
    grouped[r.kind].push(r)
  }
  return grouped
}
