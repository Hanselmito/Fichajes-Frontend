export type ReadinessItem = {
  id: string
  title: string
  status: 'done' | 'pending'
  detail: string
}

export type ReadinessSection = {
  title: string
  items: ReadinessItem[]
}