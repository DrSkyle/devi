import { BaseRepository } from './BaseRepository'
import { Task } from '@/database/models'
import { Q } from '@nozbe/watermelondb'

class TaskRepository extends BaseRepository<Task> {
  constructor() {
    super('tasks')
  }

  async create(data: Partial<Task>) {
    return await this.collection.database.write(async () => {
      return await this.collection.create((task: any) => {
        task.pharmacyId = data.pharmacyId
        task.title = data.title
        task.description = data.description || ''
        task.status = data.status || 'todo'
        task.priority = data.priority || 'medium'
        task.assignedTo = data.assignedTo || ''
        task.dueDate = data.dueDate || Date.now()
      })
    })
  }

  async updateStatus(taskId: string, newStatus: string) {
    const task = await this.find(taskId)
    if (task) {
      await this.collection.database.write(async () => {
        await task.update((t: any) => {
          t.status = newStatus
        })
      })
    }
  }

  // Helper to get tasks by status for Kanban columns
  observeByStatus(pharmacyId: string, status: string) {
    return this.query(Q.where('pharmacy_id', pharmacyId), Q.where('status', status)).observe()
  }
}

export const taskRepository = new TaskRepository()
