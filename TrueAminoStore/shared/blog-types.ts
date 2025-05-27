export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  publishedAt: string;
  updatedAt: string;
  tags: string[];
  category: string;
  featuredImage?: string;
  readTime: number;
  status: 'published' | 'draft';
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
}