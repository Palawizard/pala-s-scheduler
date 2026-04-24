import { SchedulerCalendar } from '@/components/calendar/scheduler-calendar'

export default function CalendarPage() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Calendrier</h1>
      </div>
      <SchedulerCalendar />
    </div>
  )
}
