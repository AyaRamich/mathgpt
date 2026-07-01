
const SYMBOLS = [
  { label: '∫', insert: '∫' },
  { label: '√', insert: '√(' },
  { label: 'π', insert: 'π' },
  { label: '∑', insert: '∑' },
  { label: '∞', insert: '∞' },
  { label: 'x²', insert: '^2' },
  { label: '≤', insert: '≤' },
  { label: '≥', insert: '≥' },
  { label: 'Δ', insert: 'Δ' },
  { label: 'θ', insert: 'θ' },
  { label: 'α', insert: 'α' },
  { label: 'β', insert: 'β' },
  
]

export default function SymbolBar({ onInsert }) {
  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap',
      marginBottom: '12px'
    }}>
      {SYMBOLS.map(s => (
        <button
          key={s.label}
          onClick={() => onInsert(s.insert)}
          style={{
            background: 'rgba(99,102,241,0.15)',
            border: '1px solid rgba(99,102,241,0.3)',
            color: '#a5b4fc',
            padding: '6px 12px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          {s.label}
        </button>
      ))}
    </div>
  )
}
