export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <header className="mb-8 flex flex-col gap-2">
      <h1 className="text-title text-text">{title}</h1>
      {description && <p className="text-[length:var(--text-small)] text-text-2">{description}</p>}
    </header>
  )
}
