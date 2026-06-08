import { ScrollView, View, Pressable } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';
import { Text } from 'react-native';
import { Card } from '@/components/ui/card';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: number;
  date: string;
  author: string;
  featured?: boolean;
}

const BLOG_POSTS: BlogPost[] = [
  {
    id: '1',
    title: 'Getting Started with MCP Hub: A Complete Guide',
    excerpt:
      'Learn how to set up your first MCP server, connect it to MCP Hub, and start executing tools in minutes. Perfect for beginners.',
    category: 'Tutorial',
    readTime: 8,
    date: 'Jun 5, 2026',
    author: 'Alex Chen',
    featured: true,
  },
  {
    id: '2',
    title: 'Best Practices for Managing Production MCP Servers',
    excerpt:
      'Expert tips on monitoring, security, and optimization for production environments. Learn from our most experienced users.',
    category: 'Best Practices',
    readTime: 12,
    date: 'Jun 3, 2026',
    author: 'Sarah Martinez',
    featured: true,
  },
  {
    id: '3',
    title: 'Introducing AI-Powered Recommendations',
    excerpt:
      'Our new AI assistant now provides intelligent recommendations based on your usage patterns. See how it can help you work smarter.',
    category: 'Product Update',
    readTime: 5,
    date: 'May 30, 2026',
    author: 'MCP Hub Team',
  },
  {
    id: '4',
    title: 'Scaling MCP Hub for Enterprise Teams',
    excerpt:
      'How to set up role-based access control, implement audit logging, and scale MCP Hub for your entire organization.',
    category: 'Enterprise',
    readTime: 15,
    date: 'May 25, 2026',
    author: 'James Wilson',
  },
  {
    id: '5',
    title: 'Security Deep Dive: How We Protect Your Data',
    excerpt:
      'Understanding end-to-end encryption, biometric authentication, and secure token management in MCP Hub.',
    category: 'Security',
    readTime: 10,
    date: 'May 20, 2026',
    author: 'Emma Thompson',
  },
  {
    id: '6',
    title: 'Automating Your Workflow with Webhooks',
    excerpt:
      'Discover how to use webhooks to automate complex workflows and integrate MCP Hub with your existing tools.',
    category: 'Integration',
    readTime: 9,
    date: 'May 15, 2026',
    author: 'David Park',
  },
  {
    id: '7',
    title: 'MCP Hub Mobile App: Tips & Tricks',
    excerpt:
      'Master the mobile interface with these productivity tips. Manage servers faster than ever from your phone.',
    category: 'Tips & Tricks',
    readTime: 6,
    date: 'May 10, 2026',
    author: 'Lisa Anderson',
  },
  {
    id: '8',
    title: 'Comparing MCP Hub to Traditional Server Management',
    excerpt:
      'See how MCP Hub compares to traditional approaches. Real metrics from real users managing production systems.',
    category: 'Comparison',
    readTime: 11,
    date: 'May 5, 2026',
    author: 'MCP Hub Team',
  },
];

const CATEGORIES = ['All', 'Tutorial', 'Best Practices', 'Product Update', 'Enterprise', 'Security', 'Integration', 'Tips & Tricks'];

const BlogCard = ({ post, featured = false }: { post: BlogPost; featured?: boolean }) => {
  const colors = useColors();

  return (
    <Pressable>
      <Card variant={featured ? 'elevated' : 'outlined'} className={`mb-4 ${featured ? 'border-primary' : ''}`}>
        <View className={featured ? 'p-6' : 'p-4'}>
          {/* Category Badge */}
          <View className="flex-row items-center gap-2 mb-3">
            <View className="px-2 py-1 bg-primary/10 rounded-full">
              <Text className="text-xs font-semibold text-primary">{post.category}</Text>
            </View>
            {featured && (
              <View className="px-2 py-1 bg-success/10 rounded-full">
                <Text className="text-xs font-semibold text-success">Featured</Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text className={`${featured ? 'text-xl' : 'text-base'} font-bold text-foreground mb-2`}>
            {post.title}
          </Text>

          {/* Excerpt */}
          <Text className="text-sm text-muted mb-4 leading-relaxed">{post.excerpt}</Text>

          {/* Meta */}
          <View className="flex-row items-center justify-between pt-3 border-t border-border">
            <View className="flex-row items-center gap-3">
              <View className="flex-row items-center gap-1">
                <Ionicons name="person" size={14} color={colors.muted} />
                <Text className="text-xs text-muted">{post.author}</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Ionicons name="calendar" size={14} color={colors.muted} />
                <Text className="text-xs text-muted">{post.date}</Text>
              </View>
            </View>
            <View className="flex-row items-center gap-1">
              <Ionicons name="time" size={14} color={colors.muted} />
              <Text className="text-xs text-muted">{post.readTime} min</Text>
            </View>
          </View>
        </View>
      </Card>
    </Pressable>
  );
};

export default function BlogScreen() {
  const colors = useColors();

  const featuredPosts = BLOG_POSTS.filter((p) => p.featured);
  const regularPosts = BLOG_POSTS.filter((p) => !p.featured);

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View className="bg-gradient-to-b from-primary to-primary/80 px-6 py-8">
          <Text className="text-4xl font-bold text-background mb-2">Blog & Resources</Text>
          <Text className="text-base text-background/90">
            Tips, guides, and updates from the MCP Hub team
          </Text>
        </View>

        {/* Featured Posts */}
        <View className="px-6 py-8">
          <Text className="text-lg font-bold text-foreground mb-4">Featured</Text>
          {featuredPosts.map((post) => (
            <BlogCard key={post.id} post={post} featured={true} />
          ))}
        </View>

        {/* Latest Posts */}
        <View className="px-6 pb-8">
          <Text className="text-lg font-bold text-foreground mb-4">Latest Posts</Text>
          {regularPosts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </View>

        {/* Resources Section */}
        <View className="mx-6 mb-8 p-6 bg-surface rounded-lg border border-border">
          <Text className="text-lg font-bold text-foreground mb-4">Resources</Text>
          <View className="gap-3">
            <Pressable className="flex-row items-center gap-3 py-3 border-b border-border">
              <Ionicons name="book" size={20} color={colors.primary} />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground">Documentation</Text>
                <Text className="text-xs text-muted">Complete API and feature reference</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </Pressable>

            <Pressable className="flex-row items-center gap-3 py-3 border-b border-border">
              <Ionicons name="play-circle" size={20} color={colors.primary} />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground">Video Tutorials</Text>
                <Text className="text-xs text-muted">Step-by-step guides and walkthroughs</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </Pressable>

            <Pressable className="flex-row items-center gap-3 py-3 border-b border-border">
              <Ionicons name="code-slash" size={20} color={colors.primary} />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground">Code Examples</Text>
                <Text className="text-xs text-muted">Ready-to-use code snippets and samples</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </Pressable>

            <Pressable className="flex-row items-center gap-3 py-3">
              <Ionicons name="help-circle" size={20} color={colors.primary} />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground">FAQ & Troubleshooting</Text>
                <Text className="text-xs text-muted">Common questions and solutions</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </Pressable>
          </View>
        </View>

        {/* Newsletter */}
        <View className="mx-6 mb-8 p-6 bg-primary rounded-lg">
          <Text className="text-lg font-bold text-background mb-2">Stay Updated</Text>
          <Text className="text-sm text-background/90 mb-4">
            Get the latest tips, updates, and best practices delivered to your inbox.
          </Text>
          <View className="flex-row gap-2">
            <View className="flex-1 bg-background/20 rounded-lg px-3 py-2">
              <Text className="text-xs text-background/70">your@email.com</Text>
            </View>
            <View className="bg-background/20 rounded-lg px-4 py-2">
              <Text className="text-sm font-semibold text-background">Subscribe</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
