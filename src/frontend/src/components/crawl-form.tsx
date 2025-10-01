import { AlertCircle, CheckCircle, ExternalLink, Filter, Globe, Info, Key, Loader2, Plus, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { apiCrawlCreateCrawl } from '../../client'
import type { PostCrawl } from '../../client/types.gen'

interface CrawlFormProps {
  onCrawlCreated: () => void
}

export function CrawlForm({ onCrawlCreated }: CrawlFormProps) {
  const websiteUrlId = useId()
  const geminiApiKeyId = useId()
  const urlFilterInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState<PostCrawl>({
    website_url: '',
    gemini_api_key: '',
    url_filters: [],
  })
  const [urlFilterInput, setUrlFilterInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Form validation
  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.website_url) {
      errors.website_url = 'Website URL is required'
    } else {
      try {
        new URL(formData.website_url)
      } catch {
        errors.website_url = 'Please enter a valid URL'
      }
    }

    if (!formData.gemini_api_key) {
      errors.gemini_api_key = 'Gemini API key is required'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAddUrlFilter = () => {
    if (urlFilterInput.trim() && !formData.url_filters?.includes(urlFilterInput.trim())) {
      setFormData((prev: PostCrawl) => ({
        ...prev,
        url_filters: [...(prev.url_filters || []), urlFilterInput.trim()],
      }))
      setUrlFilterInput('')
      if (urlFilterInputRef.current) {
        urlFilterInputRef.current.focus()
      }
    }
  }

  const handleRemoveUrlFilter = (filterToRemove: string) => {
    setFormData((prev: PostCrawl) => ({
      ...prev,
      url_filters: prev.url_filters?.filter((filter: string) => filter !== filterToRemove) || [],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await apiCrawlCreateCrawl({
        body: formData,
      })

      if (response.error) {
        setError(response.error.detail || 'Failed to create crawl')
        return
      }

      // Show success state
      setSuccess(true)

      // Reset form after a delay
      setTimeout(() => {
        setFormData({
          website_url: '',
          gemini_api_key: '',
          url_filters: [],
        })
        setUrlFilterInput('')
        setSuccess(false)
        onCrawlCreated()
      }, 2000)
    } catch (err) {
      setError((err as Error).message || 'Failed to create crawl')
    } finally {
      setIsLoading(false)
    }
  }

  // Clear validation errors on input change
  useEffect(() => {
    if (validationErrors.website_url && formData.website_url) {
      setValidationErrors((prev) => ({ ...prev, website_url: '' }))
    }
    if (validationErrors.gemini_api_key && formData.gemini_api_key) {
      setValidationErrors((prev) => ({ ...prev, gemini_api_key: '' }))
    }
  }, [formData.website_url, formData.gemini_api_key, validationErrors])

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg border-accent/20 bg-gradient-to-br from-card to-accent/5">
      <CardHeader className="text-center space-y-4 pb-6">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto">
          <Globe className="h-8 w-8 text-primary" />
        </div>
        <div>
          <CardTitle className="text-2xl font-bold">Generate LLMs.txt</CardTitle>
          <CardDescription className="text-base mt-2">Transform your website into AI-ready format with our intelligent crawler</CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Website URL */}
          <div className="space-y-2">
            <Label htmlFor={websiteUrlId} className="flex items-center space-x-2 text-sm font-medium">
              <Globe className="h-4 w-4 text-primary" />
              <span>Website</span>
            </Label>
            <Input
              id={websiteUrlId}
              type="url"
              placeholder="https://example.com"
              value={formData.website_url}
              onChange={(e) => setFormData((prev: PostCrawl) => ({ ...prev, website_url: e.target.value }))}
              className={`h-11 transition-all duration-200 ${validationErrors.website_url ? 'border-destructive ring-destructive/20' : 'focus:ring-primary/20'}`}
              disabled={isLoading || success}
            />
            {validationErrors.website_url && (
              <p className="text-sm text-destructive flex items-center space-x-1">
                <AlertCircle className="h-3 w-3" />
                <span>{validationErrors.website_url}</span>
              </p>
            )}
          </div>

          {/* Gemini API Key */}
          <div className="space-y-2">
            <Label htmlFor={geminiApiKeyId} className="flex items-center space-x-2 text-sm font-medium">
              <Key className="h-4 w-4 text-primary" />
              <span>Gemini API Key</span>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <div className="space-y-2">
                    <p>• Uses Gemini API free tier</p>
                    <p>• Key is not stored or logged</p>
                    <p>• Wait for your previous sessions to complete</p>
                    <div className="flex items-center space-x-1 pt-1">
                      <ExternalLink className="h-3 w-3" />
                      <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        Get API Key
                      </a>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Input
              id={geminiApiKeyId}
              type="password"
              placeholder="Enter your Gemini API key"
              value={formData.gemini_api_key}
              onChange={(e) => setFormData((prev: PostCrawl) => ({ ...prev, gemini_api_key: e.target.value }))}
              className={`h-11 transition-all duration-200 ${validationErrors.gemini_api_key ? 'border-destructive ring-destructive/20' : 'focus:ring-primary/20'}`}
              disabled={isLoading || success}
            />
            {validationErrors.gemini_api_key && (
              <p className="text-sm text-destructive flex items-center space-x-1">
                <AlertCircle className="h-3 w-3" />
                <span>{validationErrors.gemini_api_key}</span>
              </p>
            )}
          </div>

          <Separator />

          {/* URL Filters */}
          <div className="space-y-4">
            <Label className="flex items-center space-x-2 text-sm font-medium">
              <Filter className="h-4 w-4 text-primary" />
              <span>URL Filters (Optional)</span>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <div className="space-y-2 text-xs">
                    <p>Exclude URLs containing these patterns:</p>
                    <div>
                      <p>• /blog → excludes blog pages</p>
                      <p>• /admin → excludes admin pages</p>
                      <p>• .pdf → excludes PDF files</p>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </Label>

            <div className="flex gap-2">
              <Input
                ref={urlFilterInputRef}
                placeholder="e.g., /blog, /admin, .pdf"
                value={urlFilterInput}
                onChange={(e) => setUrlFilterInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddUrlFilter()
                  }
                }}
                className="h-10 transition-all duration-200 focus:ring-primary/20"
                disabled={isLoading || success}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddUrlFilter}
                disabled={!urlFilterInput.trim() || isLoading || success}
                className="h-10 px-4 hover:bg-accent transition-all duration-200"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {formData.url_filters && formData.url_filters.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-accent/20 rounded-lg border">
                {formData.url_filters.map((filter: string) => (
                  <Badge
                    key={filter}
                    variant="secondary"
                    className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-all duration-200 group border border-primary/50"
                    onClick={() => !isLoading && !success && handleRemoveUrlFilter(filter)}
                  >
                    <span>{filter}</span>
                    <X className="h-3 w-3 ml-1 group-hover:scale-110 transition-transform" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-center space-x-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Error</span>
              </div>
              <p className="text-sm text-destructive/80 mt-1">{error}</p>
            </div>
          )}

          {/* Success Display */}
          {success && (
            <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center space-x-2 text-green-700 dark:text-green-400">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Success!</span>
              </div>
              <p className="text-sm text-green-600 dark:text-green-300 mt-1">Crawl created successfully. Redirecting to dashboard...</p>
            </div>
          )}

          {/* Loading Progress */}
          {isLoading && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-primary">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">Creating your crawl...</span>
              </div>
              <Progress value={33} className="h-2" />
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            disabled={isLoading || success}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : success ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Created Successfully
              </>
            ) : (
              <>
                <Globe className="mr-2 h-4 w-4" />
                Generate LLMs.txt
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
