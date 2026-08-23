import { pipeline, env } from '@xenova/transformers'

// Disable local model loading from file system, download from HuggingFace hub
env.allowLocalModels = false;

// Set up a singleton pipeline to avoid reloading the model
class PipelineSingleton {
  static task = 'image-to-text'
  static model = 'Xenova/donut-base-finetuned-cord-v2' // Fine-tuned for receipts/invoices
  static instance = null

  static async getInstance(progress_callback = null) {
    if (this.instance === null) {
      this.instance = await pipeline(this.task, this.model, { progress_callback })
    }
    return this.instance
  }
}

// Listen for messages from the main thread
self.addEventListener('message', async (event) => {
  const { imageBase64 } = event.data
  
  try {
    // Send progress update
    self.postMessage({ status: 'loading', message: 'Loading AI Invoice Parser Model...' })
    
    // The donut model requires a specific prompt to extract document elements
    const prompt = "<s_cord-v2>"
    
    let scanner = await PipelineSingleton.getInstance(data => {
      self.postMessage({ status: 'progress', data })
    })

    self.postMessage({ status: 'processing', message: 'Analyzing invoice image...' })
    
    const output = await scanner(imageBase64, {
      prompt: prompt,
      max_new_tokens: 512,
    })

    self.postMessage({ status: 'complete', result: output })
  } catch (err) {
    self.postMessage({ status: 'error', error: err.message })
  }
})
