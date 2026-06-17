export const sampleProblems = [
  {
    id: 'caso-basico',
    name: 'Caso basico para comparar exactitud',
    problem: {
      capacity: 7,
      items: [
        { id: 1, name: 'Objeto 1', weight: 3, value: 4 },
        { id: 2, name: 'Objeto 2', weight: 4, value: 5 },
        { id: 3, name: 'Objeto 3', weight: 2, value: 3 },
        { id: 4, name: 'Objeto 4', weight: 5, value: 8 },
      ],
    },
    expectedOptimalValue: 11,
  },
  {
    id: 'greedy-no-optimo',
    name: 'Caso donde Greedy no alcanza el optimo',
    problem: {
      capacity: 50,
      items: [
        { id: 1, name: 'Objeto 1', weight: 10, value: 60 },
        { id: 2, name: 'Objeto 2', weight: 20, value: 100 },
        { id: 3, name: 'Objeto 3', weight: 30, value: 120 },
      ],
    },
    expectedOptimalValue: 220,
  },
]

