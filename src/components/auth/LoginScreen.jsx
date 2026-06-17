function LoginScreen({
  apiKey,
  loginMessage,
  onApiKeyChange,
  onSubmit,
}) {
  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-heading">
          <p className="eyebrow">Proyecto #2.</p>
          <p className="eyebrow">Análisis de Algoritmos (IC-3002) - Tecnológico de Costa Rica.</p>
          <h1>Knapsack Smart Router</h1>
        </div>

        <form className="login-form" onSubmit={onSubmit}>
          <label className="field">
            <span>API key</span>
            <input
              autoComplete="off"
              onChange={(event) => onApiKeyChange(event.target.value)}
              placeholder="Ingrese la API key..."
              type="password"
              value={apiKey}
            />
          </label>

          {loginMessage.texto ? (
            <p className={`form-message ${loginMessage.tipo}`}>{loginMessage.texto}</p>
          ) : null}

          <button className="primary-button" type="submit">
            Ingresar
          </button>
        </form>
      </section>
    </main>
  )
}

export default LoginScreen
