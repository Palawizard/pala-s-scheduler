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

export function CalendarPageContent() {
  const [open, setOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  function openCreateDialog(date?: Date) {
    setSelectedDate(date ?? null)
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer une publication</DialogTitle>
            </DialogHeader>
            <PostForm initialDate={selectedDate} onSuccess={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
      <SchedulerCalendar onDateClick={openCreateDialog} />
    </>
  )
}
