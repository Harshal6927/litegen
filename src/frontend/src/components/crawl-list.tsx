import { AlertCircle, Calendar, CheckCircle2, Clock, Download, ExternalLink, FileText, Filter, Globe, Hash, Loader2, RefreshCw, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import type { Crawl } from '../../client/types.gen'

interface CrawlListProps {
  crawls: Crawl[]
  totalCount: number
  isLoading: boolean
  onRefresh: (searchTerm?: string) => Promise<void>
  onSearch: (searchTerm?: string) => Promise<void>
}

export function CrawlList({ crawls, totalCount, isLoading, onRefresh, onSearch }: CrawlListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  // Debounce search to avoid too many API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearch(searchTerm.trim() || undefined)
    }, 400)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, onSearch])

  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return {
          color: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
          icon: CheckCircle2,
          label: 'Completed',
        }
      case 'in_progress':
      case 'processing':
        return {
          color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
          icon: Loader2,
          label: 'In Progress',
        }
      case 'failed':
        return {
          color: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
          icon: AlertCircle,
          label: 'Failed',
        }
      case 'pending':
        return {
          color: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
          icon: Clock,
          label: 'Pending',
        }
      default:
        return {
          color: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20',
          icon: Clock,
          label: status,
        }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getEstimatedTime = (pages: number, createdAt: string) => {
    if (pages === 0) return 'N/A'

    let totalSeconds = 60
    if (pages >= 10) {
      const groups = Math.floor(pages / 10) - 1
      totalSeconds += groups * 90
    }

    const createdTime = new Date(createdAt).getTime()
    const currentTime = Date.now()
    const elapsedSeconds = Math.floor((currentTime - createdTime) / 1000)
    const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds)

    if (remainingSeconds === 0) return 'Almost done'

    const minutes = Math.floor(remainingSeconds / 60)
    const seconds = remainingSeconds % 60

    if (minutes === 0) return `${seconds}s remaining`
    if (seconds === 0) return `${minutes}m remaining`
    return `${minutes}m ${seconds}s remaining`
  }

  const getProgressPercentage = (pages: number, createdAt: string) => {
    if (pages === 0) return 0

    let totalSeconds = 60
    if (pages >= 10) {
      const groups = Math.floor(pages / 10) - 1
      totalSeconds += groups * 90
    }

    const createdTime = new Date(createdAt).getTime()
    const currentTime = Date.now()
    const elapsedSeconds = Math.floor((currentTime - createdTime) / 1000)

    return Math.min(100, Math.max(0, (elapsedSeconds / totalSeconds) * 100))
  }

  const handleDownload = (url: string) => {
    window.open(url, '_blank')
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await onRefresh(searchTerm.trim() || undefined)
    setTimeout(() => setRefreshing(false), 500)
  }

  const renderSkeletonCards = () => {
    const skeletonIds = ['sk-1', 'sk-2', 'sk-3']
    return (
      <div className="space-y-4">
        {skeletonIds.map((id) => (
          <Card key={id} className="overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-3/4" />
              <div className="flex gap-4">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-20" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (isLoading && crawls.length === 0) {
    return renderSkeletonCards()
  }

  return (
    <div className="space-y-6">
      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input type="text" placeholder="Search by website" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 h-10" />
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={refreshing} className="hover:bg-accent shrink-0">
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {totalCount} crawl{totalCount !== 1 ? 's' : ''} found
          {searchTerm && ` for "${searchTerm}"`}
        </p>
        {searchTerm && crawls.length === 0 && (
          <Button variant="ghost" size="sm" onClick={() => setSearchTerm('')} className="text-muted-foreground hover:text-foreground">
            Clear search
          </Button>
        )}
      </div>

      {/* Crawl Cards */}
      {crawls.length === 0 ? (
        <div className="text-center py-12">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mx-auto mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No results found</h3>
          {searchTerm && <p className="text-muted-foreground">No crawls match your search "{searchTerm}". Try a different term.</p>}
        </div>
      ) : (
        <div className="columns-[400px]">
          {crawls.map((crawl) => {
            const statusConfig = getStatusConfig(crawl.status)
            const StatusIcon = statusConfig.icon
            const isInProgress = crawl.status.toLowerCase() === 'in_progress'
            const isCompleted = crawl.status.toLowerCase() === 'completed'

            return (
              <Card key={crawl.id} className="group mb-4 hover:shadow-md transition-all duration-200 overflow-hidden border-accent/20 hover:border-accent/30">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono text-sm font-medium">{crawl.id}</span>
                    </div>
                    <Badge className={`${statusConfig.color} border flex items-center space-x-1`}>
                      <StatusIcon className={`h-3 w-3 ${isInProgress ? 'animate-spin' : ''}`} />
                      <span className="text-xs font-medium">{statusConfig.label}</span>
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Website URL */}
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Globe className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">Website</span>
                    </div>
                    <a
                      href={crawl.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 text-sm text-primary hover:text-primary/80 transition-colors group/link"
                    >
                      <span className="truncate flex-1">{crawl.website_url}</span>
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover/link:opacity-100 transition-opacity shrink-0" />
                    </a>
                  </div>

                  <Separator />

                  {/* Progress for in-progress crawls */}
                  {isInProgress && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Progress</span>
                        <span className="text-xs text-muted-foreground">{getEstimatedTime(crawl.pages, crawl.created_at)}</span>
                      </div>
                      <Progress value={getProgressPercentage(crawl.pages, crawl.created_at)} className="h-2" />
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex justify-between text-sm">
                    <div className="text-center">
                      <div className="font-medium text-foreground">{crawl.pages}</div>
                      <div className="text-xs text-muted-foreground">Pages</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{formatDate(crawl.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* URL Filters */}
                  {crawl.url_filters && crawl.url_filters.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Filter className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">Filters</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {crawl.url_filters.slice(0, 3).map((filter: string) => (
                          <Badge key={filter} variant="outline" className="text-xs px-2 py-0.5">
                            {filter}
                          </Badge>
                        ))}
                        {crawl.url_filters.length > 3 && (
                          <Badge variant="outline" className="text-xs px-2 py-0.5">
                            +{crawl.url_filters.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Download Buttons */}
                  {isCompleted && (
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center space-x-2 mb-2">
                        <Download className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">Downloads</span>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" disabled={!crawl.llms} onClick={() => crawl.llms && handleDownload(crawl.llms)} className="flex-1 h-8 text-xs">
                          <FileText className="mr-1 h-3 w-3" />
                          llms.txt
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!crawl.llms_full}
                          onClick={() => crawl.llms_full && handleDownload(crawl.llms_full)}
                          className="flex-1 h-8 text-xs"
                        >
                          <FileText className="mr-1 h-3 w-3" />
                          llms-full.txt
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
