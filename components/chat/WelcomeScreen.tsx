'use client'

const PROMPT_CARDS = [
  {
    title: 'Design a bicycle wheel',
    description: 'Dimensions: 50mm diameter, 45mm diameter',
  },
  {
    title: 'Advise on improvements',
    description: 'Advise me on possible improvements for the following parts',
  },
  {
    title: 'F1 physics calculation',
    description: 'Help me with the calculation of the physics of a F1 car',
  },
]

interface Props {
  onSelectPrompt: (prompt: string) => void
}

export default function WelcomeScreen({ onSelectPrompt }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 py-12">
      <h1 className="text-[26px] font-semibold text-[#111827] mb-10 text-center">
        What should we build today?
      </h1>

      <div className="grid grid-cols-3 gap-4 w-full max-w-2xl">
        {PROMPT_CARDS.map((card) => (
          <button
            key={card.title}
            onClick={() => onSelectPrompt(card.title)}
            className="bg-white rounded-2xl p-5 text-left shadow-sm border border-[#e5e7eb] hover:shadow-md hover:border-[#d1d5db] transition-all cursor-pointer group"
          >
            <p className="text-[14px] font-semibold text-[#111827] mb-3 group-hover:text-[#1d4ed8] transition-colors">
              {card.title}
            </p>
            <p className="text-[12px] text-[#9ca3af] leading-relaxed">
              {card.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}