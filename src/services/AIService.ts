import { pipeline, env } from '@xenova/transformers'

// Skip local model checks since we are running in browser
env.allowLocalModels = false
env.useBrowserCache = true

class AIService {
  private extractor: any = null
  private modelId = 'Xenova/all-MiniLM-L6-v2'
  private isInitializing = false

  async initialize() {
    if (this.extractor || this.isInitializing) return

    this.isInitializing = true
    console.log('Loading AI Model...')
    try {
      this.extractor = await pipeline('feature-extraction', this.modelId)
      console.log('AI Model Loaded.')
    } catch (e) {
      console.error('Failed to load AI model:', e)
    } finally {
      this.isInitializing = false
    }
  }

  async generateEmbedding(text: string): Promise<number[] | null> {
    if (!this.extractor) {
      await this.initialize()
    }
    if (!this.extractor) return null

    try {
      const output = await this.extractor(text, { pooling: 'mean', normalize: true })
      return Array.from(output.data)
    } catch (e) {
      console.error('Embedding generation failed:', e)
      return null
    }
  }

  cosineSimilarity(a: number[], b: number[]) {
    let dotProduct = 0
    let normA = 0
    let normB = 0
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }
}

export const aiService = new AIService()
