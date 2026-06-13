import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/account')({
  component: AccountLayout,
})

function AccountLayout() {
  return <Outlet />
}
