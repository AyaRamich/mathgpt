import {
  LineChart, Line, BarChart, Bar, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

export default function SolutionGraph({ graph }) {
  if (!graph || graph.type === 'none' || !graph.data?.length) return null

  const { type, data, xlabel, ylabel } = graph

  return (
    <div style={{ width: '100%', height: 300, marginTop: '1.5rem' }}>
      <ResponsiveContainer>
        {type === 'line' && (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="x" label={{ value: xlabel, position: 'insideBottom', offset: -5 }} />
            <YAxis label={{ value: ylabel, angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Line type="monotone" dataKey="y" stroke="#6366f1" strokeWidth={2} dot={false} />
          </LineChart>
        )}
        {type === 'bar' && (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="x" label={{ value: xlabel, position: 'insideBottom', offset: -5 }} />
            <YAxis label={{ value: ylabel, angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Bar dataKey="y" fill="#6366f1" />
          </BarChart>
        )}
        {type === 'scatter' && (
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="x" name={xlabel} label={{ value: xlabel, position: 'insideBottom', offset: -5 }} />
            <YAxis dataKey="y" name={ylabel} label={{ value: ylabel, angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Scatter data={data} fill="#6366f1" />
          </ScatterChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}