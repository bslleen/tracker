export type ButtonVariant = 'primary' | 'ghost' | 'subtle' | 'danger'

export const buttonVariantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-bg hover:brightness-110 active:brightness-95',
  ghost: 'bg-transparent text-text hover:bg-surface',
  subtle: 'bg-surface text-text hover:bg-surface-2',
  danger: 'bg-danger text-bg hover:brightness-110 active:brightness-95',
}
