# Explicación de lo que llevamos hasta ahora.

Ya la lógica está implementada con los tres enfoques (backtracking, programación dinámica y greedy).

Cabe aclarar que el mock del agente todavía no llama a ninguna API externa. Solo simula cuál algoritmo escogería el agente según los parámetros.

## 1. Flujo general.

El flujo es éste:

1. La interfaz arma el problema: objetos, pesos, valores y capacidad.
2. Se mandan las restricciones del usuario. Si más exacto o más rápido.
3. El servicio del agente decide cuál algoritmo usar.
4. `AlgorithmRunner` ejecuta el algoritmo.
5. El resultado se manda al usuario.

Por ejemplo:

```js
import { createAgentRequest } from './agent/AgentDecisionContract.js'
import { AgentDecisionMockService } from './services/AgentDecisionMockService.js'
import { AlgorithmRunner } from './services/AlgorithmRunner.js'

const problem = {
  capacity: 10,
  items: [
    { id: 1, name: 'Objeto 1', weight: 4, value: 10 },
    { id: 2, name: 'Objeto 2', weight: 3, value: 7 },
  ],
}

const constraints = {
  priority: 'accuracy',
  timeLimitSeconds: 3,
}

const request = createAgentRequest(problem, constraints)

const agent = new AgentDecisionMockService()
const decision = await agent.decide(request)

const runner = new AlgorithmRunner()
const result = runner.run(problem, decision.selectedAlgorithm)
```

## 2. Directorio.

### `domain/`

Aquí están las clases del modelo.

`Item.js` representa un objeto de la mochila. Tiene `id`, `name`, `weight`, `value` y un método para calcular la densidad.

`KnapsackProblem.js` representa el problema completo. Guarda la lista de objetos y la capacidad máxima. También valida que los datos tengan sentido.

`KnapsackSolution.js` representa la respuesta que devuelve cualquier algoritmo. Ahí van los objetos seleccionados, el peso total, el valor total, el tiempo y la cantidad de operaciones.

La razón de tener estas clases es no pasar objetos sueltos por todo lado. Así los algoritmos trabajan con una estructura más clara.

### a. `algorithms/`

Aquí están las tres estrategias:

`KnapsackSolver.js` es una clase base pequeña. No hace mucho pero ayuda a que todos los algoritmos tengan sea vean parecido.

`BacktrackingSolver.js` prueba las combinaciones de incluir o no incluir cada objeto. Da la solución exacta, pero se vuelve ineficiente cuando hay muchos objetos.

`DynamicProgrammingSolver.js` usa una tabla bottom-up. También da la solución exacta. Yo creo que es buena opción cuando la capacidad no es demasiado grande.

`GreedySolver.js` ordena los objetos por densidad `valor / peso` y mete los que van cabiendo.

Lo importante es que los tres devuelven el mismo tipo de resultado, entonces desde la GUI no hay que tratarlos como casos totalmente distintos.

### b. `services/`

Aquí están las clases que conectan la lógica:

`AlgorithmRunner.js` es el archivo principal para correr algoritmos. La interfaz debería usar este servicio, no llamar directamente a los solvers.

`PerformanceTimer.js` mide el tiempo en milisegundos.

`AgentDecisionMockService.js` es el agente "falso" por ahora. Sirve para que la interfaz pueda trabajar como si ya existiera un agente real. Lo dejé como un ejemplo pero esta parte si toca integrarla con el agente real.

### c. `agent/`

Aquí queda todo listo para integrar la API de verdad.

El archivo `AgentDecisionContract.js` define:

- Las prioridades permitidas.
- Los algoritmos disponibles.
- La forma del request para el agente.
- La validación mínima de la respuesta.

`AgentPromptBuilder.js` tiene una primera base de prompts para cuando se conecte Gemini.

La integración real debería respetar este contrato para no tener que cambiar la GUI después.

### d. `data/`

Aquí dejé problemas de ejemplo y una validación manual.

El archivo `sampleProblems.js` tiene casos pequeños.

El archivo `manualValidation.js` corre los tres algoritmos sobre esos casos.

Esto lo pensé para revisar rápido que el backtracking y la programación dinámica lleguen a un resultado igual.

### e. `utils/`

Aquí puse funciones auxiliares:

- Generar problemas aleatorios.
- Validar datos.
- Formatear números, tiempos y nombres.

Es para no recargar validaciones sobre la GUI.

## 3. Decisión del mock del agente.

El mock que simula al agente toma las siguientes decisiones (como se piden en el proyecto):

- Si el usuario prioriza velocidad, usa `greedy`.
- Si busca exactitud y hay pocos objetos, usa `backtracking`.
- Si busca exactitud y la capacidad es manejable, usa `dynamic-programming`.
- Si el problema se ve muy grande, evita backtracking y programación dinámica, y mejor usa `greedy`.

La respuesta se ve así:

```js
{
  selectedAlgorithm: 'dynamic-programming',
  estimatedTimeMs: 35,
  estimatedOperations: 1200,
  confidence: 0.75,
  reason: 'Se elige Programacion Dinamica porque W es moderado y se busca exactitud.',
}
```

Cuando se conecte el agente real, lo ideal es que devuelva algo con esta misma estructura.

## 4. Resultado de los algoritmos.

Todos los algoritmos devuelven un objeto con esta forma:

```js
{
  algorithmName: 'Programacion Dinamica',
  algorithmId: 'dynamic-programming',
  selectedItems: [],
  totalWeight: 0,
  totalValue: 0,
  executionTimeMs: 0,
  operationCount: 0,
  isOptimal: true,
}
```

Algunas notas:

- `executionTimeMs` es en tiempo real.
- `operationCount` no significa exactamente lo mismo en todos los algoritmos, pero sirve para comparar el "esfuerzo".
- Lo que es backtracking y programación dinámica devuelven `isOptimal: true`.
- Greedy devuelve `isOptimal: false`, porque es una aproximación.
.

Para probar la lógica sin montar la interfaz, se puede correr esto:

```bash
node --input-type=module -e "import('./src/data/manualValidation.js').then(({ runManualValidation }) => console.log(JSON.stringify(runManualValidation(), null, 2)))"
```

En esa prueba, backtracking y programación dinámica deberían coincidir en los valores óptimos. Greedy puede dar menos valor en algunos casos, y eso está bien porque es aproximado.

## 5. Para integrar el agente real.

Hay que reemplazar el mock. Esto encontré en la documentación de Google AI Studio que se puede intentar y fue el por qué estructuré las cosas a como las hice:

1. Mantener `createAgentRequest()` como base del payload.
2. Mandar ese payload al modelo.
3. Pedir que responda JSON.
4. Validar la respuesta con `validateAgentDecision()`.
5. Ejecutar el algoritmo con `AlgorithmRunner`.

Recordar que la API key no debería quedar guardada en el repo.

Para integrar el agente no hace falta tocar mucho la lógica, solo fijarse en los archivos que hice para integrar al agente y replicar un poco lo que hace el mock pero con el agente real.
