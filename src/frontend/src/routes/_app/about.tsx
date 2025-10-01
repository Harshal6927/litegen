/** biome-ignore-all lint/correctness/noUnreachable: <> */
import { createFileRoute } from '@tanstack/react-router'
import { Clock, Code, Download, ExternalLink, FileText, Filter, Github, Globe, Heart, Shield, Sparkles, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const Route = createFileRoute('/_app/about')({
  component: RouteComponent,
})

function RouteComponent() {
  const features = [
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Optimized web crawling with intelligent content extraction for maximum efficiency.',
      color: 'text-yellow-500',
    },
    {
      icon: FileText,
      title: 'LLMs.txt Standard',
      description: 'Generate standardized files that are perfectly formatted for AI training and inference.',
      color: 'text-blue-500',
    },
    {
      icon: Filter,
      title: 'Smart Filtering',
      description: 'Advanced URL filtering system to crawl exactly the content you need.',
      color: 'text-green-500',
    },
    {
      icon: Clock,
      title: 'Real-time Progress',
      description: 'Track your crawl progress with live updates and estimated completion times.',
      color: 'text-purple-500',
    },
    {
      icon: Shield,
      title: 'Privacy First',
      description: 'Your API keys are never stored. All processing happens securely in your session.',
      color: 'text-red-500',
    },
    {
      icon: Code,
      title: 'Open Source',
      description: 'Built with modern web technologies and available for community contributions.',
      color: 'text-indigo-500',
    },
  ]

  const stats = [
    { label: 'Crawls Generated', value: '10,000+' },
    { label: 'Websites Processed', value: '5,000+' },
    { label: 'Files Downloaded', value: '25,000+' },
    { label: 'Happy Users', value: '1,000+' },
  ]

  const techStack = ['React', 'TypeScript', 'Tailwind CSS', 'shadcn/ui', 'FastAPI', 'Python', 'SQLAlchemy', 'Alembic']

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="container mx-auto px-4 py-12 max-w-6xl">WIP - About Page</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center space-y-6 mb-16">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-accent-foreground to-primary bg-clip-text text-transparent">LiteGen</h1>
              <p className="text-muted-foreground text-lg">Transform the web for AI</p>
            </div>
          </div>

          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            LiteGen is a powerful web crawler that transforms website content into AI-ready formats. Generate comprehensive{' '}
            <code className="bg-accent px-2 py-1 rounded text-accent-foreground">llms.txt</code> files that are perfectly optimized for training and inference with large language
            models.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="bg-primary hover:bg-primary/90">
              <a href="/dashboard">
                <FileText className="mr-2 h-5 w-5" />
                Get Started
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                <Github className="mr-2 h-5 w-5" />
                View on GitHub
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {stats.map((stat) => (
            <Card key={stat.label} className="text-center border-accent/20 hover:border-accent/30 transition-colors">
              <CardContent className="py-6">
                <div className="text-2xl font-bold text-primary mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Why Choose LiteGen?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built with modern technologies and designed for developers who need reliable, fast, and intelligent web content extraction.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <Card key={feature.title} className="group hover:shadow-lg transition-all duration-300 border-accent/20 hover:border-accent/30 hover:scale-[1.02]">
                  <CardHeader>
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent/20 mb-4 group-hover:scale-110 transition-transform">
                      <Icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm leading-relaxed">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* How it Works */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Simple, fast, and efficient. Get your LLMs.txt files in just a few steps.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Enter Website URL',
                description: 'Provide the website URL you want to crawl and your Gemini API key.',
                icon: Globe,
              },
              {
                step: '02',
                title: 'Configure Filters',
                description: 'Optionally add URL filters to exclude specific pages or content types.',
                icon: Filter,
              },
              {
                step: '03',
                title: 'Download Results',
                description: 'Get your generated llms.txt and llms-full.txt files ready for AI use.',
                icon: Download,
              },
            ].map((step) => {
              const Icon = step.icon
              return (
                <div key={step.step} className="flex flex-col items-center text-center space-y-4">
                  <div className="relative">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground text-xl font-bold">{step.step}</div>
                    <div className="absolute -bottom-2 -right-2 flex items-center justify-center w-8 h-8 rounded-full bg-accent border-2 border-background">
                      <Icon className="h-4 w-4 text-accent-foreground" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Tech Stack */}
        <div className="mb-16">
          <Card className="border-accent/20 bg-gradient-to-br from-card to-accent/5">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl flex items-center justify-center space-x-2">
                <Code className="h-6 w-6 text-primary" />
                <span>Built with Modern Tech</span>
              </CardTitle>
              <CardDescription>Powered by cutting-edge technologies for optimal performance and developer experience</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 justify-center">
                {techStack.map((tech) => (
                  <Badge key={tech} variant="secondary" className="px-3 py-1 text-sm">
                    {tech}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-accent/10">
            <CardContent className="py-12 space-y-6">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Ready to Get Started?</h2>
                <p className="text-muted-foreground text-lg">Join thousands of developers using LiteGen to prepare their web content for AI.</p>
              </div>
              <Button size="lg" asChild className="bg-primary hover:bg-primary/90">
                <a href="/dashboard">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Create Your First Crawl
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
