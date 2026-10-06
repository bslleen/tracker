import { motion } from 'motion/react'
import { useContainerWidth } from '@/hooks/useContainerWidth'
import { computeTreemapLayout, type CategoryTotal } from './spendingChart'

const TREEMAP_HEIGHT = 180

export interface SpendingTreemapProps {
  categories: CategoryTotal[]
  selectedCategory: string | null
  onSelectCategory: (category: string | null) => void
  prefersReducedMotion: boolean
}

export function SpendingTreemap({ categories, selectedCategory, onSelectCategory, prefersReducedMotion }: SpendingTreemapProps) {
  const { ref, width } = useContainerWidth<HTMLDivElement>()
  const rects = computeTreemapLayout(categories, width || 1, TREEMAP_HEIGHT)

  return (
    <div ref={ref} className="relative" style={{ height: TREEMAP_HEIGHT }}>
      {rects.map((rect, index) => {
        const isDimmed = selectedCategory !== null && selectedCategory !== rect.category
        return (
          <motion.button
            key={rect.category}
            type="button"
            onClick={() => onSelectCategory(selectedCategory === rect.category ? null : rect.category)}
            className="absolute flex flex-col items-start justify-end overflow-hidden p-2 text-left"
            style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height, backgroundColor: rect.color }}
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: isDimmed ? 0.4 : 1, scale: 1 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.4, delay: prefersReducedMotion ? 0 : index * 0.05 }}
          >
            <span className="truncate text-[length:var(--text-small)] font-medium text-bg">{rect.category}</span>
            <span className="num text-[length:var(--text-small)] text-bg/80">${Math.round(rect.total)}</span>
          </motion.button>
        )
      })}
    </div>
  )
}
