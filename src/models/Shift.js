import { Model } from '@nozbe/watermelondb'
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators'

export default class Shift extends Model {
  static table = 'shifts'

  @field('pharmacy_id') pharmacyId
  @field('staff_id') staffId
  @date('start_time') startTime
  @date('end_time') endTime
  @field('start_lat') startLat
  @field('start_long') startLong
  @field('end_lat') endLat
  @field('end_long') endLong
  @readonly @date('created_at') createdAt
  @readonly @date('updated_at') updatedAt

  @relation('staff', 'staff_id') staff
}
