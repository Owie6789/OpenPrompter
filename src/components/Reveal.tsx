import { motion } from "motion/react"
import { motionTokens } from "@/src/lib/motion-tokens"
import { useReducedMotion } from "@/src/hooks/use-reduced-motion"

interface RevealProps {
  readonly children: React.ReactNode
  readonly delay?: number
  readonly className?: string
  readonly as?: "div" | "section" | "article" | "span"
}

export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = "div",
}: RevealProps) {
  const reduced = useReducedMotion()
  const MotionTag = motion[Tag as keyof typeof motion] as React.ElementType

  return (
    <MotionTag
      initial={{ opacity: 0, y: reduced ? 0 : motionTokens.distance.lg }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: reduced ? 0 : motionTokens.duration.slow,
        ease: motionTokens.easing.smooth,
        delay: reduced ? 0 : delay,
      }}
      className={className}
    >
      {children}
    </MotionTag>
  )
}

interface RevealListProps {
  readonly children: React.ReactNode
  readonly className?: string
}

export function RevealList({
  children,
  className,
}: RevealListProps) {
  const reduced = useReducedMotion()

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: reduced ? 0 : 0.07,
            delayChildren: reduced ? 0 : 0.05,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export const revealItemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: motionTokens.duration.normal,
      ease: motionTokens.easing.smooth,
    },
  },
}
