function SummaryCard({ label, value, featured = false }) {
  return (
    <article className={featured ? 'summary-card featured-summary-card' : 'summary-card'}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}

export default SummaryCard

