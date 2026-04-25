'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'

import { SchedulerCalendar } from '@/components/calendar/scheduler-calendar'
import { PostForm } from '@/components/posts/post-form'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { PostView } from '@/hooks/use-posts'

export function CalendarPageContent() {
  const [open, setOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedPost, setSelectedPost] = useState<PostView | null>(null)

  function openCreateDialog(date?: Date) {
    setSelectedDate(date ?? null)
    setSelectedPost(null)
    setOpen(true)
  }

  function openEditDialog(post: PostView) {
    setSelectedDate(null)
    setSelectedPost(post)
    setOpen(true)
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Calendrier</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openCreateDialog()}>
              <Plus className="h-4 w-4" />
              Créer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[96vh] w-[calc(100vw-1rem)] max-w-[min(1500px,calc(100vw-1rem))] overflow-hidden p-0">
            <DialogHeader>
              <DialogTitle className="px-6 pt-6">
                {selectedPost ? 'Modifier la publication' : 'Créer une publication'}
              </DialogTitle>
            </DialogHeader>
            <PostForm
              key={selectedPost?.id ?? selectedDate?.toISOString() ?? 'new'}
              initialDate={selectedDate}
              post={selectedPost ?? undefined}
              onCancel={() => setOpen(false)}
              onSuccess={() => setOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
      <SchedulerCalendar onDateClick={openCreateDialog} onPostClick={openEditDialog} />
    </>
  )
}
