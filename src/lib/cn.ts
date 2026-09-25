import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// Mirror the custom theme tokens in src/styles.css so tailwind-merge resolves
// them against stock utilities instead of reading them as colors or families.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['display-sm', 'display-md', 'display-lg', 'display-xl'],
      'font-weight': ['display'],
      leading: ['display', 'code'],
      tracking: ['display', 'snug', 'label', 'eyebrow'],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
