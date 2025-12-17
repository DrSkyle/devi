<template>
  <div class="task-board-container p-4 max-w-7xl mx-auto min-h-screen pb-8">
    <!-- Header -->
    <div class="flex justify-content-between align-items-center mb-6">
      <div>
        <h1 class="text-4xl font-thin text-white mb-1 tracking-tight">Staff Tasks</h1>
        <p class="text-gray-400 text-sm">Manage daily duties and track progress.</p>
      </div>
      <Button
        label="New Task"
        icon="pi pi-plus"
        class="p-button-primary"
        @click="showCreateModal = true"
      />
    </div>

    <!-- Kanban Board -->
    <div class="grid h-full">
      <div v-for="column in columns" :key="column.id" class="col-12 md:col-4 h-full">
        <div class="glass-panel h-full flex flex-column p-0 overflow-hidden">
          <!-- Column Header -->
          <div
            class="p-3 border-bottom-1 border-white-alpha-10 flex justify-content-between align-items-center"
            :class="column.headerClass"
          >
            <span class="font-bold text-white">{{ column.title }}</span>
            <span class="bg-white-alpha-20 px-2 py-1 border-round text-xs font-bold text-white">
              {{ tasksByStatus[column.id]?.length || 0 }}
            </span>
          </div>

          <!-- Drop Zone -->
          <div
            class="flex-grow-1 p-3 overflow-y-auto custom-scrollbar flex flex-column gap-3 min-h-0"
            ref="columnRefs"
            :data-status="column.id"
            @dragover.prevent
            @drop="onDrop($event, column.id)"
          >
            <div
              v-for="task in tasksByStatus[column.id]"
              :key="task.id"
              class="glass-card p-3 cursor-move hover:bg-white-alpha-10 transition-colors border-left-3"
              :class="getPriorityClass(task.priority)"
              draggable="true"
              @dragstart="onDragStart($event, task)"
              @click="editTask(task)"
            >
              <div class="flex justify-content-between mb-2">
                <span class="text-xs font-bold uppercase tracking-wider opacity-70">{{
                  task.priority
                }}</span>
                <span class="text-xs text-gray-400" v-if="task.dueDate">
                  {{ new Date(task.dueDate).toLocaleDateString() }}
                </span>
              </div>
              <h3 class="text-white font-bold text-lg mb-1 m-0">{{ task.title }}</h3>
              <p class="text-gray-400 text-sm m-0 line-clamp-2" v-if="task.description">
                {{ task.description }}
              </p>
              <div class="mt-3 flex align-items-center gap-2" v-if="task.assignedTo">
                <Avatar
                  :label="task.assignedTo.charAt(0)"
                  shape="circle"
                  size="small"
                  class="bg-primary text-white text-xs"
                />
                <span class="text-xs text-gray-300">{{ task.assignedTo }}</span>
              </div>
            </div>

            <div
              v-if="!tasksByStatus[column.id]?.length"
              class="text-center py-6 text-gray-500 text-sm italic"
            >
              No tasks
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Task Dialog -->
    <Dialog
      v-model:visible="showCreateModal"
      :header="editingTask ? 'Edit Task' : 'New Task'"
      modal
      class="glass-dialog"
      :style="{ width: '450px' }"
    >
      <div class="flex flex-column gap-3">
        <div class="field">
          <label class="text-gray-300 text-sm mb-1 block">Title</label>
          <InputText v-model="taskForm.title" class="w-full glass-input" autofocus />
        </div>
        <div class="field">
          <label class="text-gray-300 text-sm mb-1 block">Description</label>
          <Textarea v-model="taskForm.description" rows="3" class="w-full glass-input" />
        </div>
        <div class="grid">
          <div class="col-6">
            <label class="text-gray-300 text-sm mb-1 block">Priority</label>
            <Select
              v-model="taskForm.priority"
              :options="['low', 'medium', 'high']"
              class="w-full glass-dropdown"
            />
          </div>
          <div class="col-6">
            <label class="text-gray-300 text-sm mb-1 block">Assigned To</label>
            <InputText
              v-model="taskForm.assignedTo"
              class="w-full glass-input"
              placeholder="Staff Name"
            />
          </div>
        </div>
        <div class="field">
          <label class="text-gray-300 text-sm mb-1 block">Due Date</label>
          <Calendar
            v-model="taskForm.dueDate"
            class="w-full glass-calendar"
            dateFormat="yy-mm-dd"
          />
        </div>
      </div>
      <template #footer>
        <Button
          label="Cancel"
          icon="pi pi-times"
          text
          @click="showCreateModal = false"
          class="text-gray-400"
        />
        <Button label="Save" icon="pi pi-check" @click="saveTask" :loading="isSaving" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue'
import { useProfileStore } from '@/stores/profile'
import { taskRepository } from '@/repositories/TaskRepository'
import { Q } from '@nozbe/watermelondb'

// PrimeVue
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import Calendar from 'primevue/calendar'
import Avatar from 'primevue/avatar'

const profile = useProfileStore()

// Columns Configuration
const columns = [
  { id: 'todo', title: 'To Do', headerClass: 'bg-indigo-500-alpha-20' },
  { id: 'in-progress', title: 'In Progress', headerClass: 'bg-orange-500-alpha-20' },
  { id: 'done', title: 'Done', headerClass: 'bg-green-500-alpha-20' },
]

// State
const tasksByStatus = reactive({
  todo: [],
  'in-progress': [],
  done: [],
})

const showCreateModal = ref(false)
const isSaving = ref(false)
const editingTask = ref<any>(null)

const taskForm = reactive({
  title: '',
  description: '',
  priority: 'medium',
  assignedTo: '',
  dueDate: new Date(),
})

// Subscriptions
let sub = null

onMounted(() => {
  subscribeToTasks()
})

onUnmounted(() => {
  if (sub) sub.unsubscribe()
})

const subscribeToTasks = () => {
  if (!profile.pharmacyId) return

  // Subscribe to ALL tasks and filter locally
  // This is simpler than 3 subscriptions
  sub = taskRepository
    .query(Q.where('pharmacy_id', profile.pharmacyId))
    .observe()
    .subscribe((tasks) => {
      // Reset lists
      tasksByStatus.todo = []
      tasksByStatus['in-progress'] = []
      tasksByStatus.done = []

      tasks.forEach((t) => {
        const task = { ...t._raw, id: t.id }
        if (tasksByStatus[task.status]) {
          tasksByStatus[task.status].push(task)
        } else {
          // Fallback for unknown status
          tasksByStatus.todo.push(task)
        }
      })
    })
}

// HTML5 Drag and Drop Implementation
const onDragStart = (evt: DragEvent, task: any) => {
  if (evt.dataTransfer) {
    evt.dataTransfer.dropEffect = 'move'
    evt.dataTransfer.effectAllowed = 'move'
    evt.dataTransfer.setData('taskId', task.id)
    // Add a ghost class or visual feedback if needed
  }
}

const onDrop = async (evt: DragEvent, status: string) => {
  const taskId = evt.dataTransfer?.getData('taskId')
  if (taskId) {
    // Optimistic update (optional, but WatermelonDB is fast enough usually)
    await taskRepository.updateStatus(taskId, status)
  }
}

// Helper for priority colors
const getPriorityClass = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'border-red-500'
    case 'medium':
      return 'border-orange-500'
    case 'low':
      return 'border-green-500'
    default:
      return 'border-gray-500'
  }
}

const saveTask = async () => {
  isSaving.value = true
  try {
    if (editingTask.value) {
      // Edit logic here if needed
    } else {
      await taskRepository.create({
        pharmacyId: profile.pharmacyId,
        ...taskForm,
        dueDate: taskForm.dueDate ? taskForm.dueDate.getTime() : Date.now(),
      })
    }
    showCreateModal.value = false
    resetForm()
  } catch (e) {
    console.error(e)
  } finally {
    isSaving.value = false
  }
}

const editTask = (task: any) => {
  // Placeholder for edit functionality
  console.log('Edit task', task)
}

const resetForm = () => {
  taskForm.title = ''
  taskForm.description = ''
  taskForm.priority = 'medium'
  taskForm.assignedTo = ''
  taskForm.dueDate = new Date()
}

// Watch for pharmacyId to update local state for the manual DnD
watch(() => profile.pharmacyId, subscribeToTasks)
</script>

<style scoped>
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}

.border-left-3 {
  border-left-width: 3px !important;
  border-left-style: solid;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
