export interface Phase {
  label: string
  minutes: number
  instruction: string
  friendlyInstruction: string
  groups: string
}

export interface Structure {
  id: number
  lsNumber: number
  lsUrl: string
  name: string
  nickname: string
  time: number
  minParticipants: number
  maxParticipants: number
  complexity: 'basic' | 'intermediate' | 'advanced'
  purposes: Purpose[]
  online: boolean
  desc: string
  when: string
  structuralInvitation: string
  attribution: string
  phases: Phase[]
  tips: string[]
}

export type Purpose =
  | 'ideation'
  | 'reflection'
  | 'decision'
  | 'planning'
  | 'engagement'
  | 'connection'

export type SessionMode = 'inperson' | 'virtual' | 'hybrid'
export type LanguageMode = 'ls' | 'friendly'
export type ParticipantLocation = 'inperson' | 'virtual'

export interface Participant {
  name: string
  location: ParticipantLocation
}

export interface SessionConfig {
  participants: Participant[]
  mode: SessionMode
  language: LanguageMode
}

export interface Recommendation {
  structureId: number
  reason: string
  rank: number
}

export interface FilterState {
  query: string
  purpose: Purpose | ''
  maxTime: number
  minParticipants: number
  online: boolean | null
  complexity: Structure['complexity'] | ''
}
