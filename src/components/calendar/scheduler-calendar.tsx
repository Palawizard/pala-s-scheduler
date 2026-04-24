'use client'

import dayGridPlugin from '@fullcalendar/daygrid'
import type { CalendarOptions } from '@fullcalendar/core'
import interactionPlugin, { type DateClickArg } from '@fullcalendar/interaction'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import { toast } from 'sonner'

import { usePosts, useUpdatePost } from '@/hooks/use-posts'
import { PLATFORM_COLORS } from '@/lib/constants'

type SchedulerCalendarProps = {
  onDateClick?: (date: Date) => void
}

type EventDropInfo = Parameters<NonNullable<CalendarOptions['eventDrop']>>[0]

export function SchedulerCalendar({ onDateClick }: SchedulerCalendarProps) {
  const { data: posts = [], isLoading } = usePosts()
  const updatePost = useUpdatePost()

  const events = posts
    .filter((post) => post.scheduledAt)
    .map((post) => {
      const firstPlatform = post.platforms[0]?.platform

      return {
        id: post.id,
        title: post.title || post.caption || 'Publication',
        start: post.scheduledAt ?? undefined,
        backgroundColor: firstPlatform ? PLATFORM_COLORS[firstPlatform] : '#525252',
        borderColor: firstPlatform ? PLATFORM_COLORS[firstPlatform] : '#525252',
        extendedProps: { post },
      }
    })

  async function handleEventDrop(eventDrop: EventDropInfo) {
    const nextDate = eventDrop.event.start
    if (!nextDate) {
      eventDrop.revert()
      return
    }

    try {
      await updatePost.mutateAsync({
        id: eventDrop.event.id,
        payload: { scheduledAt: nextDate.toISOString() },
      })
      toast.success('Publication déplacée')
    } catch (error) {
      eventDrop.revert()
      toast.error(error instanceof Error ? error.message : 'Déplacement impossible')
    }
  }

  function handleDateClick(dateClick: DateClickArg) {
    onDateClick?.(dateClick.date)
  }

  return (
    <div className="min-h-0 flex-1 rounded-lg border bg-white p-3">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale="fr"
        height="100%"
        editable
        selectable
        nowIndicator
        events={events}
        dateClick={handleDateClick}
        eventDrop={handleEventDrop}
        buttonText={{
          today: 'Aujourd’hui',
          month: 'Mois',
          week: 'Semaine',
          day: 'Jour',
        }}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
      />
      {isLoading && (
        <div className="text-muted-foreground mt-3 text-sm">Chargement du calendrier...</div>
      )}
    </div>
  )
}
