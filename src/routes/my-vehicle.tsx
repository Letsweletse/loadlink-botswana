import { createFileRoute } from '@tanstack/react-router'
import VehicleRegistration from '@/pages/VehicleRegistration'
export const Route = createFileRoute('/my-vehicle')({ component: VehicleRegistration })
