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
        slug: '1-1-to-1-3',
        name: 'Topics 1.1–1.3',
        details: 'Change in Tandem; Rates of Change; Rates of Change in Linear and Quadratic Functions.',
        href: 'https://www.youtube.com/watch?v=Y4476mBsJu0',
      },
      {
        slug: '1-4-to-1-6',
        name: 'Topics 1.4–1.6',
        details: 'Polynomial Functions and Rates of Change; Complex Zeros; End Behavior.',
        href: 'https://www.youtube.com/watch?v=FjJ6pr_m_ME',
      },
      {
        slug: '1-7-to-1-10',
        name: 'Topics 1.7–1.10',
        details: 'Rational Functions — End Behavior, Zeros, Vertical Asymptotes, and Holes.',
        href: 'https://www.youtube.com/watch?v=5DJAOTLfJfM',
      },
      {
        slug: '1-11-to-1-12',
        name: 'Topics 1.11–1.12',
        details: 'Equivalent Representations of Polynomial and Rational Expressions; Transformations of Functions.',
        href: 'https://www.youtube.com/watch?v=DPWLcTYDgRw',
      },
      {
        slug: '1-13-to-1-14',
        name: 'Topics 1.13–1.14',
        details: 'Function Model Selection and Assumption Articulation; Function Model Construction and Application.',
        href: 'https://www.youtube.com/watch?v=vT0L1y3t-0E',
      },
      {
        slug: '2-4-to-2-6',
        name: 'Topics 2.4–2.6',
        details: 'Exponential Function Manipulation; Context and Data Modeling; Competing Function Model Validation.',
        href: 'https://www.youtube.com/watch?v=VMFovH6gLGs',
      },
      {
        slug: '2-7-to-2-10',
        name: 'Topics 2.7–2.10',
        details: 'Composition of Functions; Inverse Functions; Logarithmic Expressions; Inverses of Exponential Functions.',
        href: 'https://www.youtube.com/watch?v=Q2-ik0aBRck',
      },
      {
        slug: '2-11-to-2-15',
        name: 'Topics 2.11–2.15',
        details: 'Logarithmic Functions and Manipulation; Exponential and Logarithmic Equations; Context Modeling; Semi-log Plots.',
        href: 'https://www.youtube.com/watch?v=rom6F9XBVR4',
      },
      {
        slug: '3-1-to-3-3',
        name: 'Topics 3.1–3.3',
        details: 'Periodic Phenomena; Sine, Cosine, and Tangent; Sine and Cosine Function Values.',
        href: 'https://www.youtube.com/watch?v=dQY3gb-LUsE',
      },
      {
        slug: '3-4-to-3-6',
        name: 'Topics 3.4–3.6',
        details: 'Sine and Cosine Function Graphs; Sinusoidal Functions; Sinusoidal Function Transformations.',
        href: 'https://www.youtube.com/watch?v=GQUFSgOrELs',
      },
      {
        slug: '3-10-to-3-12',
        name: 'Topics 3.10–3.12',
        details: 'Trigonometric Equations and Inequalities; Secant, Cosecant, and Cotangent; Equivalent Representations.',
        href: 'https://www.youtube.com/watch?v=XYlLEoVKx50',
      },
      {
        slug: '3-13-to-3-15',
        name: 'Topics 3.13–3.15',
        details: 'Trigonometry and Polar Coordinates; Polar Function Graphs; Rates of Change in Polar Functions.',
        href: 'https://www.youtube.com/watch?v=RJGWFKdhEFU',
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
