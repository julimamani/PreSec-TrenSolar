export function ChartLegend({
  items,
}: {
  items: Array<{ label: string; color: string; dashed?: boolean }>
}) {
  return (
    <div className="chart-legend" aria-label="Referencias del gráfico">
      {items.map((item) => (
        <span className="chart-legend__item" key={item.label}>
          <span
            className={`chart-legend__mark${item.dashed ? ' is-dashed' : ''}`}
            style={{ backgroundColor: item.color }}
          />
          {item.label}
        </span>
      ))}
    </div>
  )
}
