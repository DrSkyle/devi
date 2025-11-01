<template>
  <div class="forecasting-container">
    <header class="view-header">
      <h1 class="title">AI Sales Forecasting</h1>
      <p class="subtitle">Predict future sales demand based on your historical data.</p>
    </header>

    <div class="card">
      <h2>Select an Item to Forecast</h2>
      <p v-if="isTraining" class="training-status">
        🧠 AI model is training in the background... Forecasts will become more accurate.
      </p>
      <p v-else-if="model" class="training-status-done">✅ AI model is trained and ready.</p>
      <p v-else class="training-status-fail">
        ⚠️ Not enough data to train the main AI model. Using reliable fallback.
      </p>

      <div class="form-group">
        <label for="search">Search Inventory Item</label>
        <input
          id="search"
          type="text"
          v-model="searchQuery"
          @input="searchItems"
          placeholder="Search for an item to forecast..."
        />
        <ul v-if="searchResults.length > 0" class="search-results">
          <li
            v-for="result in searchResults"
            :key="result.item.key"
            @click="runForecast(result.item)"
          >
            <strong>{{ result.item.name }}</strong>
          </li>
        </ul>
      </div>
    </div>

    <div v-if="isForecasting" class="card loading-state">
      <p>Generating forecast...</p>
    </div>

    <div v-if="forecastData.length > 0" class="card chart-card">
      <h3>30-Day Forecast for: {{ forecastItemName }}</h3>
      <p class="section-subtitle">
        Using: <strong>{{ forecastMethodUsed }}</strong>
      </p>
      <apexchart type="line" height="350" :options="chartOptions" :series="chartSeries"></apexchart>
    </div>
  </div>
</template>

<script setup>
import { ref, onActivated, computed } from 'vue'
import { supabase } from '@/supabase'
import { useProfileStore } from '@/stores/profile'
import { decryptData } from '@/utils/cipher'
import * as tf from '@tensorflow/tfjs'
import Fuse from 'fuse.js'
import VueApexCharts from 'vue3-apexcharts'
import { useNotificationStore } from '@/stores/notification'

const apexchart = VueApexCharts
const profile = useProfileStore()
const notification = useNotificationStore()

// --- State ---
const allSales = ref([])
const isTraining = ref(false)
const model = ref(null) // The main AI model
const itemScaler = ref({ min: 0, max: 0 })
const isForecasting = ref(false)
const forecastData = ref([])
const forecastItemName = ref('')
const forecastMethodUsed = ref('')

// --- Search State ---
let fuse
const searchableInventory = ref([])
const searchQuery = ref('')
const searchResults = ref([])

// --- Chart State ---
const chartSeries = computed(() => [
  { name: 'Predicted Sales', data: forecastData.value.map((d) => d.sales) },
])
const chartOptions = computed(() => ({
  chart: { toolbar: { show: false }, animations: { enabled: true } },
  theme: { mode: 'dark' },
  tooltip: { theme: 'dark', y: { formatter: (val) => Math.round(val) } },
  grid: { borderColor: '#4a5568' },
  xaxis: {
    categories: forecastData.value.map((d) => d.date),
    labels: { style: { colors: '#a0aec0' } },
  },
  yaxis: {
    title: { text: 'Predicted Units Sold', style: { color: '#a0aec0' } },
    labels: {
      style: { colors: '#a0aec0' },
      formatter: (val) => Math.round(val),
    },
  },
  dataLabels: { enabled: false },
}))

// --- 1. Load Data & Auto-Train on Activate ---
onActivated(async () => {
  if (profile.pharmacyId) {
    // Load sales data
    const { data: salesData } = await supabase
      .from('sales')
      .select('created_at, items')
      .eq('pharmacy_id', profile.pharmacyId)
      .neq('status', 'void')
    allSales.value = salesData || []

    // Load inventory for search
    const { data: inventoryData } = await supabase
      .from('inventory')
      .select('*')
      .eq('pharmacy_id', profile.pharmacyId)
      .gt('quantity', 0)

    if (inventoryData) {
      setupSearch(inventoryData)
    }

    // *** AUTOMATIC AI TRAINING ***
    // Only train if the model isn't already in memory
    if (!model.value && !isTraining.value) {
      autoTrainMainModel()
    }
  }
})

// --- 2. Setup Search ---
const setupSearch = (inventoryData) => {
  const groupedItems = Object.values(
    inventoryData.reduce((acc, item) => {
      const name = decryptData(item.name)
      const brandName = decryptData(item.brand_name)
      const key = `${name.trim()}|${brandName ? brandName.trim() : ''}`
      if (!acc[key]) {
        acc[key] = { key, name, brandName }
      }
      return acc
    }, {}),
  )
  searchableInventory.value = groupedItems
  fuse = new Fuse(searchableInventory.value, { keys: ['name', 'brandName'], threshold: 0.3 })
}

const searchItems = () => {
  if (!fuse || searchQuery.value.length < 2) {
    searchResults.value = []
    return
  }
  searchResults.value = fuse.search(searchQuery.value, { limit: 5 })
}

// --- 3. Preprocess Data ---
const preprocessData = (itemName) => {
  const salesByDay = {}
  const decryptedItemName = itemName.toLowerCase()

  for (const sale of allSales.value) {
    const date = new Date(sale.created_at).toISOString().split('T')[0]
    for (const item of sale.items) {
      const name = decryptData(item.name)
      if (name && name.toLowerCase() === decryptedItemName) {
        if (!salesByDay[date]) salesByDay[date] = 0
        salesByDay[date] += item.quantity
      }
    }
  }

  const sortedDates = Object.keys(salesByDay).sort()
  if (sortedDates.length === 0) return []

  const startDate = new Date(sortedDates[0])
  const endDate = new Date() // Use today as end date
  const timeSeries = []

  let currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0]
    timeSeries.push(salesByDay[dateStr] || 0)
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return timeSeries
}

// --- 4. Main AI Model Training (Automatic) ---
const autoTrainMainModel = async () => {
  isTraining.value = true
  await tf.nextFrame() // Let UI update

  // Find the most sold item to train a general-purpose model
  // This is a simple way, a better way would be to find the item with the most *days* of sales
  const allItemSales = {}
  allSales.value.forEach((sale) => {
    sale.items.forEach((item) => {
      const name = decryptData(item.name)
      if (name) {
        allItemSales[name] = (allItemSales[name] || 0) + item.quantity
      }
    })
  })
  const mostSoldItem = Object.entries(allItemSales).sort((a, b) => b[1] - a[1])[0]?.[0]

  if (!mostSoldItem) {
    isTraining.value = false
    return
  }

  const timeSeries = preprocessData(mostSoldItem.toLowerCase())

  if (!timeSeries || timeSeries.length < 30) {
    // Need at least 30 data points for AI
    isTraining.value = false
    return
  }

  // --- AI Training Logic ---
  const tsTensor = tf.tensor1d(timeSeries)
  const tsMin = tsTensor.min()
  const tsMax = tsTensor.max()
  const tsRange = tsMax.sub(tsMin)
  const normalizedSeries = tsTensor.sub(tsMin).div(tsRange)

  itemScaler.value = { min: (await tsMin.data())[0], max: (await tsMax.data())[0] }

  const sequenceLength = 7
  const sequences = []
  const labels = []
  const normalizedValues = await normalizedSeries.data()

  for (let i = 0; i < normalizedValues.length - sequenceLength; i++) {
    sequences.push(normalizedValues.slice(i, i + sequenceLength))
    labels.push(normalizedValues[i + sequenceLength])
  }

  const X = tf
    .tensor2d(sequences, [sequences.length, sequenceLength])
    .reshape([-1, sequenceLength, 1])
  const y = tf.tensor1d(labels)

  const newModel = tf.sequential()
  newModel.add(tf.layers.lstm({ units: 32, inputShape: [sequenceLength, 1] }))
  newModel.add(tf.layers.dense({ units: 1 }))
  newModel.compile({ optimizer: 'adam', loss: 'meanSquaredError' })

  await newModel.fit(X, y, { epochs: 50, batchSize: 8 })

  model.value = newModel // Save the trained model
  isTraining.value = false
}

// --- 5. Main Forecast Function (The "Hybrid" Logic) ---
const runForecast = async (item) => {
  isForecasting.value = true
  forecastItemName.value = item.name
  forecastData.value = []
  await tf.nextFrame()

  const timeSeries = preprocessData(item.name.toLowerCase())

  // --- THIS IS THE HYBRID LOGIC ---
  if (timeSeries.length > 30 && model.value) {
    // A. We have lots of data AND the AI model is ready
    forecastMethodUsed.value = 'AI Model (TensorFlow.js)'
    forecastData.value = await runTensorFlowForecast(timeSeries)
  } else if (timeSeries.length > 3) {
    // B. We have *some* data, but not enough for AI. Use the safe fallback.
    forecastMethodUsed.value = 'Statistical Fallback (Reliable)'
    forecastData.value = runStatisticalForecast(timeSeries, 30)
  } else {
    // C. Not enough data for any forecast.
    notification.showNotification(
      'Not enough sales history for this item to create a forecast.',
      'error',
    )
  }

  isForecasting.value = false
  searchQuery.value = ''
  searchResults.value = []
}

// --- 6. The "AI" Prediction Function ---
const runTensorFlowForecast = async (timeSeries) => {
  const { min, max } = itemScaler.value // Use the *globally* trained scaler
  const range = max - min
  if (range === 0) return runStatisticalForecast(timeSeries, 30) // Fallback if scaler is bad

  const lastSequence = timeSeries.slice(-7)
  let inputSequence = lastSequence.map((val) => (val - min) / range)
  const predictions = []
  let lastDate = new Date()

  for (let i = 0; i < 30; i++) {
    const inputTensor = tf.tensor2d(inputSequence, [1, 7]).reshape([1, 7, 1])
    const prediction = model.value.predict(inputTensor)
    const predictedValue = (await prediction.data())[0]

    const denormalizedPred = predictedValue * range + min
    const roundedPred = Math.round(denormalizedPred)

    lastDate.setDate(lastDate.getDate() + 1)
    predictions.push({
      date: lastDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      sales: roundedPred < 0 ? 0 : roundedPred,
    })

    inputSequence.shift()
    inputSequence.push(predictedValue)
    tf.dispose([inputTensor, prediction])
  }
  return predictions
}

// --- 7. The "Fallback" Prediction Function ---
const runStatisticalForecast = (data, daysToForecast) => {
  const alpha = 0.3
  let smoothed = [data[0]]
  for (let i = 1; i < data.length; i++) {
    smoothed.push(alpha * data[i] + (1 - alpha) * smoothed[i - 1])
  }

  const forecastValue = smoothed[smoothed.length - 1]
  const predictions = []
  let lastDate = new Date()

  for (let i = 0; i < daysToForecast; i++) {
    lastDate.setDate(lastDate.getDate() + 1)
    predictions.push({
      date: lastDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      sales: forecastValue < 0 ? 0 : Math.round(forecastValue),
    })
  }
  return predictions
}
</script>

<style scoped>
.forecasting-container {
  max-width: 800px;
  margin: 0 auto;
}
.card {
  margin-top: 2rem;
}
.section-subtitle {
  color: var(--color-text-light);
  margin-bottom: 1.5rem;
}
.training-status,
.training-status-done,
.training-status-fail {
  font-size: 0.9rem;
  font-style: italic;
  color: var(--color-text-light);
  margin-bottom: 1.5rem;
  padding: 0.75rem;
  border-radius: 8px;
  background-color: var(--color-surface-mute);
}
.training-status {
  color: var(--color-saffron-orange);
}
.training-status-done {
  color: var(--color-peacock-teal);
}
.training-status-fail {
  color: var(--color-danger);
}
.loading-state {
  text-align: center;
  padding: 3rem;
}
.search-results {
  list-style: none;
  padding: 0;
  margin-top: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  max-height: 200px;
  overflow-y: auto;
}
.search-results li {
  padding: 1rem;
  cursor: pointer;
}
.search-results li:hover {
  background-color: var(--color-surface-mute);
}
.chart-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}
.form-group {
  margin-bottom: 1.5rem;
}
.form-group label {
  display: block;
  margin-bottom: 0.6rem;
  font-weight: 500;
  color: var(--color-light-slate);
}
</style>
