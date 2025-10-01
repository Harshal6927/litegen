import { createFileRoute } from '@tanstack/react-router'
import { ArrowRight, FileText, Zap } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { CrawlForm } from '@/components/crawl-form'
import { CrawlList } from '@/components/crawl-list'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { apiCrawlListCrawls } from '../../../client'
import type { GetCrawl } from '../../../client/types.gen'

export const Route = createFileRoute('/_app/dashboard')({
  component: RouteComponent,
})

function RouteComponent() {
  const [crawls, setCrawls] = useState<GetCrawl>({ count: 0, crawls: [] })
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const loadCrawls = useCallback(async (searchTerm?: string) => {
    try {
      setIsLoading(true)
      const response = await apiCrawlListCrawls({
        query: searchTerm ? { term: searchTerm } : undefined,
      })

      if (response.data) {
        setCrawls(response.data)
      }
    } catch (error) {
      console.error('Failed to load crawls:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCrawls()
  }, [loadCrawls])

  const handleCrawlCreated = () => {
    loadCrawls()
    setShowForm(false) // Hide form after successful creation
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-background via-background to-accent/5">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center space-y-6 mb-12">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent">LiteGen</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Transform your website content into AI-ready format with intelligent web crawler. Generate comprehensive llms.txt files in minutes.
          </p>
        </div>

        {/* Main Content */}
        <div className="flex flex-col space-y-8">
          {/* Quick Actions Card */}
          {!showForm && (
            <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5 hover:border-primary/30 transition-colors">
              <CardContent className="flex flex-col items-center justify-center py-12 space-y-6">
                <div className="flex items-center space-x-4 text-center">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Ready to generate your LLMs.txt?</h3>
                    <p className="text-muted-foreground mb-4">Start by creating a new crawl session for your website</p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowForm(true)}
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <FileText className="mr-2 h-5 w-5" />
                  Create New Crawl
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Form Section */}
          {showForm && (
            <div className="flex flex-col space-y-4">
              <CrawlForm onCrawlCreated={handleCrawlCreated} />
            </div>
          )}

          {/* Separator */}

          <div className="flex items-center space-x-4">
            <Separator className="flex-1" />
            <span className="text-sm text-muted-foreground font-medium">Crawls</span>
            <Separator className="flex-1" />
          </div>

          {/* Crawl List Section */}

          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Recent Crawls</h2>
              </div>
              {!showForm && (
                <Button onClick={() => setShowForm(true)} variant="outline" className="hover:bg-accent">
                  <FileText className="mr-2 h-4 w-4" />
                  New
                </Button>
              )}
            </div>
            <CrawlList crawls={crawls.crawls} totalCount={crawls.count} isLoading={isLoading} onRefresh={loadCrawls} onSearch={loadCrawls} />
          </div>
        </div>
      </div>
    </div>
  )
}
