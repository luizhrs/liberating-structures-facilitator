import type { Structure, Purpose, Recommendation } from '../types'

// ─── Rule-based recommender ──────────────────────────────────────────────────

interface RecommendInput {
  challenge: string
  participants: number
  timeAvailable: number
  purposes: Purpose[]
  online: boolean | null
}

const PURPOSE_KEYWORDS: Record<Purpose, string[]> = {
  ideation: ['idea', 'creat', 'generat', 'innovat', 'brainstorm', 'new', 'solution', 'bold', 'possibil'],
  reflection: ['learn', 'reflect', 'review', 'retrospect', 'debrief', 'assess', 'evaluat', 'what happened'],
  decision: ['decide', 'priorit', 'choos', 'select', 'rank', 'vote', 'align', 'agreement', 'stuck'],
  planning: ['plan', 'strateg', 'next step', 'action', 'roadmap', 'forward', 'future', 'goal', 'launch'],
  engagement: ['energy', 'connect', 'quiet', 'voice', 'include', 'engage', 'silent', 'shy', 'dominate', 'everyone'],
  connection: ['trust', 'relationship', 'team', 'know each other', 'new group', 'conflict', 'tension', 'disconnect'],
}

function scoreStructure(structure: Structure, input: RecommendInput): number {
  let score = 0
  const text = input.challenge.toLowerCase()

  // Purpose keyword matching
  for (const purpose of input.purposes) {
    if (structure.purposes.includes(purpose)) score += 10
  }

  // Keyword matching from challenge text
  for (const [purpose, keywords] of Object.entries(PURPOSE_KEYWORDS)) {
    const matches = keywords.filter(k => text.includes(k)).length
    if (matches > 0 && structure.purposes.includes(purpose as Purpose)) {
      score += matches * 4
    }
  }

  // Participant count fit
  if (
    input.participants >= structure.minParticipants &&
    input.participants <= structure.maxParticipants
  ) {
    score += 8
  } else if (input.participants < structure.minParticipants) {
    score -= 15
  }

  // Time fit
  if (structure.time <= input.timeAvailable) {
    score += 6
    // Bonus for good time utilisation (using 50-90% of available time)
    const utilisation = structure.time / input.timeAvailable
    if (utilisation >= 0.5 && utilisation <= 0.9) score += 4
  } else {
    // Penalise structures that take longer than available
    score -= 20
  }

  // Online fit
  if (input.online === true && !structure.online) score -= 12
  if (input.online === false && structure.online) score += 2

  // Prefer basic complexity for shorter sessions
  if (input.timeAvailable <= 30 && structure.complexity === 'basic') score += 5
  if (input.timeAvailable >= 90 && structure.complexity === 'advanced') score += 3

  return score
}

export function getRuleBasedRecommendations(
  structures: Structure[],
  input: RecommendInput,
  count = 3
): Recommendation[] {
  const scored = structures.map(s => ({
    structureId: s.id,
    score: scoreStructure(s, input),
  }))

  scored.sort((a, b) => b.score - a.score)

  // Generate a reason for each recommendation
  return scored.slice(0, count).map((item, index) => {
    const structure = structures.find(s => s.id === item.structureId)!
    return {
      structureId: item.structureId,
      rank: index + 1,
      reason: generateReason(structure, input),
    }
  })
}

function generateReason(structure: Structure, input: RecommendInput): string {
  const reasons: string[] = []

  if (input.participants >= structure.minParticipants && input.participants <= structure.maxParticipants) {
    reasons.push(`works well for groups of ${input.participants}`)
  }

  if (structure.time <= input.timeAvailable) {
    reasons.push(`fits within your ${input.timeAvailable}-minute window`)
  }

  const matchingPurposes = structure.purposes.filter(p => input.purposes.includes(p))
  if (matchingPurposes.length > 0) {
    reasons.push(`designed for ${matchingPurposes.join(' and ')}`)
  }

  if (input.online && structure.online) {
    reasons.push('runs well online')
  }

  return reasons.length > 0
    ? reasons.join(', ') + '.'
    : structure.when
}

// ─── Gemini AI recommender ───────────────────────────────────────────────────

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

export async function getAIRecommendations(
  structures: Structure[],
  input: RecommendInput,
  apiKey: string,
  count = 3
): Promise<Recommendation[]> {
  const structureSummaries = structures
    .map(
      s =>
        `ID:${s.id} | "${s.name}" | ${s.time}min | ${s.minParticipants}-${s.maxParticipants} people | purposes: ${s.purposes.join(',')} | online: ${s.online} | "${s.desc}"`
    )
    .join('\n')

  const prompt = `You are an expert Liberating Structures facilitator. A facilitator needs help choosing the right structure(s).

Challenge they described: "${input.challenge}"
Number of participants: ${input.participants}
Time available: ${input.timeAvailable} minutes
Preferred purposes: ${input.purposes.join(', ') || 'not specified'}
Online session: ${input.online === null ? 'not specified' : input.online}

Available structures:
${structureSummaries}

Recommend exactly ${count} structures that best fit this situation. Choose structures that genuinely match the challenge — don't just pick the most famous ones. For each, explain in 1-2 concise sentences why it fits this specific challenge and group.

Respond ONLY with a valid JSON array, no other text:
[{"structureId": <number>, "rank": <1|2|3>, "reason": "<1-2 sentences explaining the fit>"}]`

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 500,
      },
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Gemini API error: ${response.status}`)
  }

  const data = await response.json()
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error('Could not parse AI response')

  const parsed = JSON.parse(jsonMatch[0]) as Recommendation[]
  return parsed.sort((a, b) => a.rank - b.rank)
}
