'use client'

import type { CalendarOptions } from '@fullcalendar/core'
import interactionPlugin, { type DateClickArg } from '@fullcalendar/interaction'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import { CalendarDays } from 'lucide-react'
import { toast } from 'sonner'

import { PostEvent } from '@/components/calendar/post-event'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { type PostView, usePosts, useUpdatePost } from '@/hooks/use-posts'
import { PLATFORM_COLORS } from '@/lib/constants'

type SchedulerCalendarProps = {
  onDateClick?: (date: Date) => void
  onPostClick?: (post: PostView) => void
}

type EventDropInfo = Parameters<NonNullable<CalendarOptions['eventDrop']>>[0]
type EventClickInfo = Parameters<NonNullable<CalendarOptions['eventClick']>>[0]

export function SchedulerCalendar({ onDateClick, onPostClick }: SchedulerCalendarProps) {
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

  function handleEventClick(eventClick: EventClickInfo) {
    const post = eventClick.event.extendedProps.post as PostView | undefined
    if (post) onPostClick?.(post)
  }

  return (
    <div className="min-h-0 flex-1 rounded-lg border bg-white p-3">
      {isLoading ? (
        <div className="flex h-full min-h-[520px] flex-col gap-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-9 w-36" />
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-9 w-24" />
          </div>
          <div className="grid flex-1 grid-cols-7 gap-2">
            {Array.from({ length: 28 }).map((_, index) => (
              <Skeleton key={index} className="min-h-24 rounded-md" />
            ))}
          </div>
        </div>
      ) : (
        <div className="relative h-full min-h-[520px]">
          <FullCalendar
            plugins={[timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            locale="fr"
            height="100%"
            editable
            selectable
            nowIndicator
            events={events}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            eventDrop={handleEventDrop}
            eventContent={(eventInfo) => <PostEvent post={eventInfo.event.extendedProps.post} />}
            buttonText={{
              today: 'Aujourd’hui',
              week: 'Semaine',
            }}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: '',
            }}
          />
          {posts.length === 0 && (
            <EmptyState
              className="absolute inset-x-4 top-24 z-10 bg-white/95 shadow-sm backdrop-blur"
              description="Cliquez sur un créneau du calendrier pour préparer votre première publication."
              icon={<CalendarDays className="h-8 w-8" />}
              title="Aucune publication planifiée"
            />
          )}
        </div>
      )}
    </div>
  )
}
