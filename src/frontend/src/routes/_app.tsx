import { createFileRoute, Outlet } from '@tanstack/react-router'
import { Navbar } from '@/components/navbar'

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

function AppLayout() {
  return (
    <div className="min-h-screen smooth-scroll">
      <Navbar />
      <main className="pb-safe page-transition">
        <div className="animate-fade-in-up">
          <Outlet />
        </div>
      </main>
      {/* Footer */}
      <footer className="mt-auto px-4 pb-4">
        <div className="text-center text-slate-500">
          <div>
            <a href="https://www.harshallaheri.me/" target="_blank" rel="noopener noreferrer">
              Built by <span className="font-medium text-primary">Harshal</span>
            </a>
          </div>
          <div>
            <a href="https://litestar.dev/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1">
              <span>Powered by</span>
              {process.env.NODE_ENV === 'production' ? (
                <img src="/static/litestar.svg" width="25" height="25" alt="Litestar logo" className="inline-block" />
              ) : (
                <img src="/litestar.svg" width="25" height="25" alt="Litestar logo" className="inline-block" />
              )}
              <span className="font-medium text-[#edb641]">Litestar</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
