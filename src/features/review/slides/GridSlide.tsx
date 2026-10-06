import { motion } from 'motion/react'
import { ChunkGrid } from '@/features/goals/ChunkGrid'
import type { SubjectSummary } from '../insights'
import { containerVariants, itemVariants } from '../reviewVariants'

export interface TopSubjectGridSlideProps {
  name: string
  hours: number
  totalChunks: number
  chunkMinutes: number
  hue: number
  prefersReducedMotion: boolean
}

/** "Top subject" — its mini grid rendered fully lit (every chunk, as a celebratory total-invested visual, not a literal completion percentage). MiniChunkGrid stages its own fill-in stagger on mount, capped well under a second — timed to finish before the slide advances. */
export function TopSubjectGridSlide({ name, hours, totalChunks, chunkMinutes, hue, prefersReducedMotion }: TopSubjectGridSlideProps) {
  return (
    <motion.div
      variants={containerVariants(prefersReducedMotion)}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center gap-6 px-8 text-center"
    >
      <motion.p variants={itemVariants(prefersReducedMotion)} className="text-[length:var(--text-small)] text-text-2">
        Your top subject
      </motion.p>
      <motion.p variants={itemVariants(prefersReducedMotion)} className="text-title text-text">
        {name}
      </motion.p>
      <motion.div variants={itemVariants(prefersReducedMotion)} className="w-full max-w-64">
        <ChunkGrid total={totalChunks} completed={totalChunks} chunkMinutes={chunkMinutes} accentShade={hue} size="sm" label={name} />
      </motion.div>
      <motion.p variants={itemVariants(prefersReducedMotion)} className="num text-[length:var(--text-small)] text-text-2">
        {hours.toFixed(1)}h invested
      </motion.p>
    </motion.div>
  )
}

export interface SubjectsFinishedSlideProps {
  subjects: SubjectSummary[]
  prefersReducedMotion: boolean
}

export function SubjectsFinishedSlide({ subjects, prefersReducedMotion }: SubjectsFinishedSlideProps) {
  return (
    <motion.div
      variants={containerVariants(prefersReducedMotion)}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center gap-6 px-8 text-center"
    >
      <motion.div variants={itemVariants(prefersReducedMotion)}>
        <span className="num text-hero leading-none text-text">{subjects.length}</span>
      </motion.div>
      <motion.p variants={itemVariants(prefersReducedMotion)} className="text-[length:var(--text-small)] text-text-2">
        subject{subjects.length === 1 ? '' : 's'} finished
      </motion.p>

      <div className="flex w-full flex-col gap-4">
        {subjects.slice(0, 5).map((subject) => (
          <motion.div key={subject.name} variants={itemVariants(prefersReducedMotion)} className="flex flex-col gap-2">
            <span className="truncate text-[length:var(--text-small)] text-text">{subject.name}</span>
            <ChunkGrid
              total={subject.totalChunks}
              completed={subject.totalChunks}
              chunkMinutes={subject.chunkMinutes}
              accentShade={subject.hue}
              size="sm"
              label={subject.name}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
