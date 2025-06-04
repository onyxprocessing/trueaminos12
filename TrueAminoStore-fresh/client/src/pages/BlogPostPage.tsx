import React from 'react'
import { Link, useParams } from 'wouter'
import Layout from '@/components/Layout'
import { blogPosts } from '@shared/blog-data'
import { Clock, User, Tag, ArrowLeft, Share2 } from 'lucide-react'

const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const post = blogPosts.find(p => p.slug === slug)

  if (!post) {
    return (
      <Layout title="Post Not Found | TrueAminos">
        <div className="container mx-auto px-6 py-16 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Post Not Found</h1>
          <p className="text-gray-600 mb-8">The blog post you're looking for doesn't exist.</p>
          <Link href="/blog" className="text-[#0096c7] hover:text-[#007bb3] font-medium">
            ← Back to Blog
          </Link>
        </div>
      </Layout>
    )
  }

  // Convert markdown-style content to basic HTML
  const formatContent = (content: string) => {
    return content
      .split('\n')
      .map(line => {
        // Headers
        if (line.startsWith('# ')) {
          return `<h1 class="text-3xl font-heading font-bold text-gray-900 mb-6 mt-8">${line.slice(2)}</h1>`
        }
        if (line.startsWith('## ')) {
          return `<h2 class="text-2xl font-heading font-bold text-gray-900 mb-4 mt-8">${line.slice(3)}</h2>`
        }
        if (line.startsWith('### ')) {
          return `<h3 class="text-xl font-heading font-semibold text-gray-900 mb-3 mt-6">${line.slice(4)}</h3>`
        }
        if (line.startsWith('#### ')) {
          return `<h4 class="text-lg font-heading font-semibold text-gray-900 mb-3 mt-4">${line.slice(5)}</h4>`
        }
        
        // Bold text
        line = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
        
        // Italic text
        line = line.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
        
        // Code inline
        line = line.replace(/`(.*?)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono">$1</code>')
        
        // Lists
        if (line.startsWith('- ')) {
          return `<li class="mb-2">${line.slice(2)}</li>`
        }
        if (/^\d+\./.test(line)) {
          return `<li class="mb-2">${line.replace(/^\d+\.\s*/, '')}</li>`
        }
        
        // Empty lines
        if (line.trim() === '') {
          return '<br/>'
        }
        
        // Regular paragraphs
        if (line.trim() && !line.startsWith('<')) {
          return `<p class="mb-4 leading-relaxed text-gray-700">${line}</p>`
        }
        
        return line
      })
      .join('\n')
  }

  return (
    <Layout 
      title={`${post.title} | TrueAminos Blog`}
      description={post.excerpt}
      keywords={post.tags.join(', ')}
      type="article"
    >
      {/* Breadcrumb */}
      <section className="bg-gray-50 py-4">
        <div className="container mx-auto px-6 max-w-4xl">
          <nav className="flex items-center space-x-2 text-sm">
            <Link href="/" className="text-[#0096c7] hover:text-[#007bb3]">Home</Link>
            <span className="text-gray-400">/</span>
            <Link href="/blog" className="text-[#0096c7] hover:text-[#007bb3]">Blog</Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-600 truncate">{post.title}</span>
          </nav>
        </div>
      </section>

      {/* Article Header */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-6 max-w-4xl">
          <Link 
            href="/blog"
            className="inline-flex items-center text-[#0096c7] hover:text-[#007bb3] mb-6 font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Link>
          
          <div className="mb-6">
            <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mb-4">
              {post.category}
            </span>
            
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-6 leading-tight">
              {post.title}
            </h1>
            
            <div className="flex flex-wrap items-center text-gray-600 text-sm gap-4 mb-6">
              <div className="flex items-center">
                <User className="w-4 h-4 mr-2" />
                {post.author}
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                {post.readTime} min read
              </div>
              <div>
                {new Date(post.publishedAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.map(tag => (
                <span key={tag} className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Article Content */}
      <section className="py-8">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="prose prose-lg max-w-none">
            <div 
              dangerouslySetInnerHTML={{ __html: formatContent(post.content) }}
              className="text-gray-800 leading-relaxed"
            />
          </div>
          
          {/* Share Section */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Share this article</h3>
                <p className="text-gray-600 text-sm">Help others discover this research content</p>
              </div>
              <button className="flex items-center px-4 py-2 bg-[#0096c7] text-white rounded-md hover:bg-[#007bb3] transition">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </button>
            </div>
          </div>

          {/* Related Posts */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h3 className="text-2xl font-heading font-bold text-gray-900 mb-6">Related Articles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {blogPosts
                .filter(p => p.id !== post.id && p.status === 'published')
                .slice(0, 2)
                .map(relatedPost => (
                  <Link
                    key={relatedPost.id}
                    href={`/blog/${relatedPost.slug}`}
                    className="block bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition"
                  >
                    <div className="text-sm text-[#0096c7] font-medium mb-2">
                      {relatedPost.category}
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {relatedPost.title}
                    </h4>
                    <p className="text-gray-600 text-sm line-clamp-3">
                      {relatedPost.excerpt}
                    </p>
                    <div className="flex items-center text-gray-500 text-xs mt-3">
                      <Clock className="w-3 h-3 mr-1" />
                      {relatedPost.readTime} min read
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-50 to-cyan-50 py-16">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <h3 className="text-2xl font-heading font-bold text-gray-900 mb-4">
            Interested in Research-Grade Peptides?
          </h3>
          <p className="text-gray-600 mb-8">
            Explore our premium research compounds with guaranteed purity and detailed COAs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/products"
              className="bg-[#0096c7] text-white px-6 py-3 rounded-md font-medium hover:bg-[#007bb3] transition"
            >
              Browse Products
            </Link>
            <Link 
              href="/contact"
              className="border border-[#0096c7] text-[#0096c7] px-6 py-3 rounded-md font-medium hover:bg-[#0096c7] hover:text-white transition"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  )
}

export default BlogPostPage