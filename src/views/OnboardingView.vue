<template>
  <div class="onboarding-container min-h-screen flex flex-column overflow-hidden relative">
    <!-- Background Effects -->
    <div class="absolute top-0 left-0 w-full h-full gradient-bg z-0"></div>
    <div class="absolute top-0 left-0 w-full h-full noise-overlay z-0 opacity-10"></div>
    
    <!-- Content Layer -->
    <div class="flex-grow-1 flex align-items-center justify-content-center relative z-1 p-4">
      <transition name="fade" mode="out-in">
        <div :key="currentSlide" class="text-center max-w-2xl">
          
          <!-- Slide Content -->
          <div class="mb-8 relative">
             <!-- Image Placeholder (using icons for now) -->
             <div class="w-12rem h-12rem mx-auto bg-white-alpha-10 border-circle flex align-items-center justify-content-center mb-6 shadow-8 glass-icon-container">
                <i v-if="slides[currentSlide].icon" :class="slides[currentSlide].icon" class="text-6xl text-white"></i>
             </div>
             
             <h1 class="text-5xl font-thin text-white mb-4 tracking-tight slide-title">{{ slides[currentSlide].title }}</h1>
             <p class="text-xl text-gray-300 line-height-3 max-w-lg mx-auto">{{ slides[currentSlide].desc }}</p>
          </div>

          <!-- Indicators -->
          <div class="flex justify-content-center gap-2 mb-8">
            <div 
              v-for="(slide, index) in slides" 
              :key="index"
              class="w-3 h-1 border-round transition-all duration-500 cursor-pointer"
              :class="currentSlide === index ? 'bg-white w-2rem' : 'bg-white-alpha-20'"
              @click="currentSlide = index"
            ></div>
          </div>

        </div>
      </transition>
    </div>

    <!-- Bottom Actions -->
    <div class="relative z-2 p-6 w-full max-w-4xl mx-auto flex justify-content-between align-items-center mb-4">
      <Button 
        v-if="currentSlide < slides.length - 1"
        label="Skip" 
        text 
        class="text-gray-400 hover:text-white"
        @click="finishOnboarding"
      />
      <div v-else></div> <!-- Spacer -->

      <Button 
        v-if="currentSlide < slides.length - 1"
        label="Next" 
        icon="pi pi-arrow-right" 
        iconPos="right"
        class="glass-button px-5 font-bold"
        @click="nextSlide"
      />
      <Button 
        v-else
        label="Get Started" 
        icon="pi pi-rocket" 
        class="glass-button-primary px-6 py-3 font-bold text-xl shadow-8"
        @click="finishOnboarding"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'

const router = useRouter()
const currentSlide = ref(0)

const slides = [
  {
    title: "Honoring a Legacy",
    desc: "Built in memory of a scholar who believed that knowledge is the greatest form of service.",
    icon: "pi pi-book"
  },
  {
    title: "Compassion is Strength",
    desc: "Pharmacy is not a business. It is the art of healing your community when they are most vulnerable.",
    icon: "pi pi-heart"
  },
  {
    title: "The Devi Network",
    desc: "Join a decentralized mesh of pharmacies working together. Share stock, knowledge, and hope.",
    icon: "pi pi-globe"
  }
]

const nextSlide = () => {
  if (currentSlide.value < slides.length - 1) {
    currentSlide.value++
  }
}

const finishOnboarding = () => {
  localStorage.setItem('hasSeenOnboarding', 'true')
  router.push('/login')
}
</script>

<style scoped>
.gradient-bg {
  background: radial-gradient(circle at 50% 0%, #1e1b4b 0%, #0f172a 100%);
}

.glass-icon-container {
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 0 50px rgba(79, 70, 229, 0.2);
}

.glass-button {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  transition: all 0.3s ease;
}

.glass-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.glass-button-primary {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  color: white;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.glass-button-primary:hover {
  transform: scale(1.05) translateY(-2px);
  box-shadow: 0 10px 30px rgba(16, 185, 129, 0.4);
}

.slide-title {
  text-shadow: 0 2px 10px rgba(0,0,0,0.5);
}

/* Animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
