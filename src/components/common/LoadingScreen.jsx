function LoadingScreen({ title, detail }) {
  return (
    <main className="app-loader">
      <div className="app-loader-mark" />
      <p className="eyebrow">Knapsack Smart Router</p>
      <h1>{title}</h1>
      <p>{detail}</p>
    </main>
  )
}

export default LoadingScreen

