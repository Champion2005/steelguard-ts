import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { SiGithub } from 'react-icons/si'
import { useState } from 'react'
import reforge_logo from "../assets/reforge.svg"

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/demo', label: 'Demo' },
  { to: '/docs', label: 'Docs' },
  { to: '/blog', label: 'Blog' },
]

export default function Navbar() {
  const location = useLocation()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <nav className="flex h-16 items-center px-6 sm:px-10">
        {/* Left — Logo */}
        <Link
          to="/"
          className="flex items-center gap-3 text-lg font-semibold tracking-tight text-foreground"
        >
          <img src={reforge_logo} alt="Reforge logo" className="h-9 w-9" />
          Reforge
        </Link>

        {/* Center — Nav links */}
        <div className="hidden flex-1 items-center justify-center gap-1 sm:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
                (link.to === '/' ? location.pathname === '/' : location.pathname.startsWith(link.to))
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right — External links */}
        <div className="hidden items-center gap-3 sm:flex">
          <a
            href="https://www.npmjs.com/package/reforge-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md px-2.5 py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          >
            npm
          </a>
          <a
            href="https://github.com/Champion2005/reforge"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub repository"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <SiGithub className="h-5 w-5" />
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="ml-auto rounded-md p-2 text-muted-foreground hover:bg-muted sm:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-border/60 bg-background/95 px-4 pb-4 pt-2 backdrop-blur-xl sm:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className={`block rounded-md px-3 py-2 text-sm font-medium ${
                (link.to === '/' ? location.pathname === '/' : location.pathname.startsWith(link.to))
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <a
            href="https://www.npmjs.com/package/reforge-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-md px-3 py-2 text-sm text-muted-foreground"
          >
            npm
          </a>
          <a
            href="https://github.com/Champion2005/reforge"
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-md px-3 py-2 text-sm text-muted-foreground"
          >
            GitHub
          </a>
        </div>
      )}
    </header>
  )
}
