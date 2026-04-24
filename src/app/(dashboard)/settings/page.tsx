import Link from 'next/link'

export default function SettingsPage() {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Paramètres</h1>
      </div>
      <nav className="flex flex-col gap-1">
        <Link
          href="/settings/platforms"
          className="text-muted-foreground hover:text-foreground rounded-md px-3 py-2 text-sm transition-colors hover:bg-neutral-100"
        >
          Comptes connectés
        </Link>
      </nav>
    </div>
  )
}
