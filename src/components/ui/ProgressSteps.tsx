import { motion } from 'framer-motion'

interface Step {
  label: string
  icon: string
}

interface Props {
  steps: Step[]
  currentStep: number
}

export default function ProgressSteps({ steps, currentStep }: Props) {
  return (
    <div className="flex flex-col gap-2">
      {steps.map((step, i) => {
        const isDone = i < currentStep
        const isActive = i === currentStep
        return (
          <div key={i} className="flex items-center gap-2.5 text-sm">
            <motion.div
              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                isDone
                  ? 'bg-accent'
                  : isActive
                  ? 'bg-accent shadow-[0_0_8px_rgba(200,255,0,0.6)]'
                  : 'bg-border'
              }`}
              animate={isActive ? { scale: [1, 1.3, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1.2 }}
            />
            <span className={isDone || isActive ? 'text-text-secondary' : 'text-text-dim'}>
              {step.icon} {step.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
