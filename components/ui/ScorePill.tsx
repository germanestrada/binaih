import { scorePillClass, scoreLabel } from '@/lib/utils'

export default function ScorePill({ score }: { score: number }) {
  return (
    <span style={{ fontSize:12,fontWeight:600,padding:'3px 10px',borderRadius:20 }} className={scorePillClass(score)}>
      {score} — {scoreLabel(score)}
    </span>
  )
}
