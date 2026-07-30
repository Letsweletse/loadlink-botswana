import { createFileRoute } from '@tanstack/react-router'
import BookingDetail from '@/pages/BookingDetail'
export const Route = createFileRoute('/booking/$id')({ component: BookingDetail })
