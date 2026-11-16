// ─── Domain model for UBTI AI Atlas ─────────────────────────────────────────
// Every date is an ISO string so documents serialise cleanly to the client.

export type Role = 'admin' | 'editor' | 'sales' | 'manager' | 'viewer';
export const ROLES: { id: Role; label: string; help: string }[] = [
  { id: 'admin', label: 'Admin', help: 'Everything, including users and site settings' },
  { id: 'editor', label: 'AI Team', help: 'Create, edit and publish projects, posts' },
  { id: 'sales', label: 'Sales / Marketing', help: 'Client microsites, posts, leads' },
  { id: 'manager', label: 'Manager', help: 'Read-only admin + analytics' },
  { id: 'viewer', label: 'Viewer', help: 'Can browse internal projects only' },
];

export interface AppUser {
  id: string; // Firebase uid (or local id)
  email: string;
  name: string;
  role: Role;
  createdAt: string;
  lastLoginAt?: string;
}

export type ProjectStatus = 'draft' | 'review' | 'published' | 'archived';
/** public = anyone · internal = staff only, never on client links · microsite = client links + staff */
export type Visibility = 'public' | 'internal' | 'microsite';
export type Maturity = 'template' | 'production' | 'pilot' | 'poc';

export const MATURITY: Record<Maturity, string> = {
  template: 'Ready-to-deploy template',
  production: 'In production',
  pilot: 'Pilot',
  poc: 'Proof of concept',
};

export interface StoredFile {
  path: string; // storage path (bucket key or local relative path)
  url: string; // browser URL
  name?: string;
  caption?: string;
  contentType?: string;
}

export interface SlideExtract {
  index: number; // 1-based slide/page number
  title: string;
  text: string;
  notes?: string;
  images: StoredFile[];
}

export interface ProjectSource {
  fileName: string;
  file: StoredFile;
  kind: 'pptx' | 'pdf';
  slides: SlideExtract[];
  selectedSlides: number[];
  skippedMedia?: number; // EMF/WMF/huge media we could not show
  extractedAt: string;
}

export interface FlowStep {
  title: string;
  detail?: string;
}

export interface Metric {
  label: string;
  value: string;
}

export interface DemoStatus {
  ok: boolean;
  code: number | null;
  checkedAt: string;
  error?: string;
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  industryId: string;
  extraIndustryIds: string[];
  clientName?: string; // real name — staff only
  clientDisplay?: string; // what outsiders see, e.g. "Leading UAE MEP contractor"
  region?: string;
  problem: string; // markdown
  solution: string; // markdown
  impact: string; // markdown
  metrics: Metric[];
  features: string[];
  techStack: string[];
  platformIds: string[];
  architecture: {
    image?: StoredFile;
    flow: FlowStep[];
    description: string;
  };
  media: {
    video?: StoredFile;
    videoEmbedUrl?: string; // YouTube / Stream / SharePoint / Vimeo link
    thumbnail?: StoredFile;
    screenshots: StoredFile[];
  };
  demoUrl?: string;
  demoStatus?: DemoStatus;
  deck?: StoredFile;
  source?: ProjectSource;
  maturity: Maturity;
  reuseScore?: number; // 0-100
  weeksToDeploy?: number;
  visibility: Visibility;
  status: ProjectStatus;
  featured: boolean;
  aiSuggestions?: string[];
  isSample?: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  /** Present only for published projects when AI is configured. Never sent to the browser. */
  embedding?: number[];
}

export interface Industry {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  description: string;
  imageUrl: string;
  icon: string;
  order: number;
  isSample?: boolean;
}

export const PLATFORM_CATEGORIES = [
  'Data platforms & warehouses',
  'Relational databases',
  'NoSQL, search & vector',
  'ERP',
  'CRM & customer service',
  'ITSM, HR & operations',
  'Documents & collaboration',
  'Industry systems',
  'Streaming, IoT & APIs',
] as const;
export type PlatformCategory = (typeof PLATFORM_CATEGORIES)[number];

export interface Platform {
  id: string;
  slug: string;
  name: string;
  vendor: string;
  category: PlatformCategory;
  description: string;
  aiPatterns: string[];
  connectVia: string;
  order: number;
  logoUrl?: string;
  isSample?: boolean;
}

export type CertLevel = 'Fundamentals' | 'Associate' | 'Expert' | 'Specialty' | 'Business';
export interface Certification {
  id: string;
  code: string;
  name: string;
  level: CertLevel;
  track: 'AI' | 'Data & Fabric' | 'Power Platform' | 'Azure' | 'Other';
  badgeUrl: string;
  learnUrl: string;
  holders: number;
  status: 'active' | 'retired';
  note?: string;
  show: boolean;
  order: number;
  isSample?: boolean;
}

export type PostType = 'blog' | 'case-study';
export interface Post {
  id: string;
  type: PostType;
  slug: string;
  title: string;
  excerpt: string;
  body: string; // markdown
  cover?: StoredFile;
  coverUrl?: string;
  tags: string[];
  author: string;
  industryId?: string;
  projectIds: string[];
  clientDisplay?: string;
  results?: Metric[];
  status: 'draft' | 'published';
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  isSample?: boolean;
}

export interface CompanySettings {
  id: 'main';
  name: string;
  productName: string;
  tagline: string;
  subTagline: string;
  pitchLine: string;
  about: string; // markdown
  stats: Metric[];
  capabilities: string[];
  partnerLine: string;
  contactEmail: string;
  website: string;
  offices: string[];
  updatedAt?: string;
}

export interface Pitch {
  id: string;
  slug: string;
  clientName: string;
  clientLogo?: StoredFile;
  industryId?: string;
  region?: string;
  context: string; // sales notes used for matching
  intro: string;
  projectIds: string[];
  reframes: Record<string, string>;
  status: 'active' | 'archived';
  expiresAt?: string;
  viewCount: number;
  uniqueVisitors: number;
  lastViewedAt?: string;
  createdBy?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PitchEvent {
  id: string;
  pitchId: string;
  type: 'open' | 'project_view' | 'dwell' | 'demo_click' | 'video_play';
  projectId?: string;
  seconds?: number;
  visitorId: string;
  at: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  industryId?: string;
  message: string;
  source: string; // 'contact' | 'project:<slug>' | 'microsite:<slug>'
  status: 'new' | 'contacted' | 'closed';
  createdAt: string;
}

export type Collections = {
  projects: Project;
  industries: Industry;
  platforms: Platform;
  certifications: Certification;
  posts: Post;
  company: CompanySettings;
  pitches: Pitch;
  pitchEvents: PitchEvent;
  leads: Lead;
  users: AppUser;
};
export type CollectionName = keyof Collections;
