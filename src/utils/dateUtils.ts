import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import duration from 'dayjs/plugin/duration'

dayjs.extend(relativeTime)
dayjs.extend(duration)

export const formatDate = (date: string | number | Date, format = 'YYYY-MM-DD') => {
  return dayjs(date).format(format)
}

export const formatDateTime = (date: string | number | Date, format = 'YYYY-MM-DD HH:mm:ss') => {
  return dayjs(date).format(format)
}

export const formatTime = (date: string | number | Date, format = 'HH:mm') => {
  return dayjs(date).format(format)
}

export const fromNow = (date: string | number | Date) => {
  return dayjs(date).fromNow()
}

export const timestamp = () => {
  return dayjs().valueOf()
}

export const getDuration = (start: string | number | Date, end: string | number | Date) => {
  const diff = dayjs(end).diff(dayjs(start))
  return dayjs.duration(diff)
}

export const formatDuration = (start: string | number | Date, end: string | number | Date) => {
  const d = getDuration(start, end)
  const hours = Math.floor(d.asHours())
  const minutes = d.minutes()
  return `${hours}h ${minutes}m`
}

export const isExpiringSoon = (expiryDate: string | number | Date, days = 30) => {
  if (!expiryDate) return false
  const expiry = dayjs(expiryDate)
  const today = dayjs().startOf('day')
  const threshold = today.add(days, 'day')

  return (expiry.isBefore(threshold) && expiry.isAfter(today)) || expiry.isSame(today)
}

export default dayjs
