import { runAlgorithmWorkerTask } from './algorithmWorkerCore.js'

self.onmessage = (event) => {
  const response = runAlgorithmWorkerTask(event.data)
  self.postMessage(response)
}

