import { motion } from 'motion/react'
import { SPRING_SNAPPY } from '@/lib/motion'

/**
 * One layoutId per nav tier (bottom bar / rail / sidebar), all inside one
 * shared <LayoutGroup id="navigation"> in Navigation.tsx — the id namespaces
 * them so they never collide with an unrelated layoutId elsewhere in the app
 * (e.g. a goal card's shared-element expansion).
 */
export function ActivePill({ layoutId, className }: { layoutId: string; className?: string }) {
  return <motion.div layoutId={layoutId} className={className} transition={SPRING_SNAPPY} />
}
