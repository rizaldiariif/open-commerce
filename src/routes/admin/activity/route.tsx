import { createFileRoute } from '@tanstack/react-router'

import { AdminModulePage } from '../-admin-page'
import { type AdminWorkspace, Panel } from '../-shared'

function ActivityPanel({
  workspace,
}: Readonly<{
  workspace: AdminWorkspace
}>) {
  return (
    <Panel title="Recent admin activity">
      <div className="stack-list">
        {workspace.recentActivity.map((activity) => (
          <div key={activity._id}>
            <strong>
              {activity.action} {activity.targetTable}
            </strong>
            <span>
              {activity.targetId ?? 'unknown target'} -{' '}
              {new Date(activity.createdAt).toLocaleString()}
            </span>
          </div>
        ))}
        {workspace.recentActivity.length === 0 ? (
          <p className="empty-state">
            No admin activity has been recorded yet.
          </p>
        ) : null}
      </div>
    </Panel>
  )
}

export const Route = createFileRoute('/admin/activity')({
  component: AdminActivity,
})

function AdminActivity() {
  return (
    <AdminModulePage activeModule="activity">
      {({ workspace }) => <ActivityPanel workspace={workspace} />}
    </AdminModulePage>
  )
}
