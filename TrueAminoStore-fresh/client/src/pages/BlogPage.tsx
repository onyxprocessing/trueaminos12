import React from 'react'
import { Link } from 'wouter'
import Layout from '@/components/Layout'
import { blogPosts, blogCategories } from '@shared/blog-data'
import { Clock, User, Tag } from 'lucide-react'

const BlogPage: React.FC = () => {
  const publishedPosts = blogPosts.filter(post => post.status === 'published')

  return (
    <Layout 
      title="Research Blog | TrueAminos"
      description="Stay informed with the latest research insights, peptide studies, and scientific findings from TrueAminos. Expert analysis on BPC-157, MT-2, and more."
      keywords="peptide research, BPC-157, Melanotan-2, research blog, scientific studies, peptide education"
    >
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-50 to-cyan-50 py-16">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-6">
              Research <span className="text-[#0096c7]">Blog</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Explore the latest research insights, scientific studies, and educational content 
              about peptides and research compounds from our expert team.
            </p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 bg-white border-b">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/blog" className="px-4 py-2 bg-[#0096c7] text-white rounded-full text-sm font-medium hover:bg-[#007bb3] transition">
              All Posts
            </Link>
            {blogCategories.map(category => (
              <Link 
                key={category.id}
                href={`/blog/category/${category.slug}`}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-16">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <div className="space-y-8">
                {publishedPosts.map(post => (
                  <article key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="p-6">
                      <div className="flex items-center text-sm text-gray-500 mb-3">
                        <User className="w-4 h-4 mr-2" />
                        <span className="mr-4">{post.author}</span>
                        <Clock className="w-4 h-4 mr-2" />
                        <span className="mr-4">{post.readTime} min read</span>
                        <span>{new Date(post.publishedAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}</span>
                      </div>
                      
                      <h2 className="text-2xl font-heading font-bold text-gray-900 mb-3 hover:text-[#0096c7] transition">
                        <Link href={`/blog/${post.slug}`}>
                          {post.title}
                        </Link>
                      </h2>
                      
                      <p className="text-gray-600 mb-4 leading-relaxed">
                        {post.excerpt}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-2">
                          {post.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                              <Tag className="w-3 h-3 mr-1" />
                              {tag}
                            </span>
                          ))}
                        </div>
                        
                        <Link 
                          href={`/blog/${post.slug}`}
                          className="text-[#0096c7] font-medium hover:text-[#007bb3] transition"
                        >
                          Read More →
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="space-y-8">
                {/* Categories Widget */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-heading font-bold text-gray-900 mb-4">Categories</h3>
                  <div className="space-y-2">
                    {blogCategories.map(category => (
                      <Link
                        key={category.id}
                        href={`/blog/category/${category.slug}`}
                        className="block p-3 rounded-md hover:bg-gray-50 transition"
                      >
                        <div className="font-medium text-gray-900">{category.name}</div>
                        <div className="text-sm text-gray-600">{category.description}</div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Recent Posts Widget */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-heading font-bold text-gray-900 mb-4">Recent Posts</h3>
                  <div className="space-y-4">
                    {publishedPosts.slice(0, 3).map(post => (
                      <Link
                        key={post.id}
                        href={`/blog/${post.slug}`}
                        className="block group"
                      >
                        <h4 className="font-medium text-gray-900 group-hover:text-[#0096c7] transition line-clamp-2">
                          {post.title}
                        </h4>
                        <div className="text-sm text-gray-500 mt-1">
                          {new Date(post.publishedAt).toLocaleDateString()}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Newsletter Signup */}
                <div className="bg-gradient-to-br from-[#0096c7] to-[#007bb3] rounded-lg shadow-md p-6 text-white">
                  <h3 className="text-xl font-heading font-bold mb-4">Stay Updated</h3>
                  <p className="text-blue-100 mb-4">
                    Get the latest research insights and educational content delivered to your inbox.
                  </p>
                  <div className="space-y-3">
                    <input
                      type="email"
                      placeholder="Enter your email"
                      className="w-full px-4 py-2 rounded-md text-gray-900 placeholder-gray-500"
                    />
                    <button className="w-full bg-white text-[#0096c7] px-4 py-2 rounded-md font-medium hover:bg-gray-100 transition">
                      Subscribe
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  )
}

export default BlogPage