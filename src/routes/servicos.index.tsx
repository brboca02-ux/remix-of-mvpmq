import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/servicos/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/servicos/"!</div>
}
