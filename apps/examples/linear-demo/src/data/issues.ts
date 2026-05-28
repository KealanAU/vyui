export type IssuePriority = 'urgent' | 'high' | 'medium' | 'low' | 'none'
export type IssueStatus = 'backlog' | 'todo' | 'in-progress' | 'in-review' | 'done'

export interface Issue {
  id: string
  title: string
  status: IssueStatus
  priority: IssuePriority
  assignee: string
  project: string
  updated: string
  /** Long-press preview body. Falls back via `resolveDescription`. */
  description?: string
}

// Shared fallback for issues without their own description body — keeps the
// preview popover content meaningful for every row.
const STUB_DESCRIPTION =
  'No additional context yet — open the issue to add a description, attach context, or assign someone.'

export function resolveDescription(i: Issue): string {
  return i.description ?? STUB_DESCRIPTION
}

export const issues: Issue[] = [
  {
    id: 'VYU-128',
    title: 'Centre modals inside OverlayRoot on Lynx',
    status: 'in-progress',
    priority: 'urgent',
    assignee: 'vyui',
    project: 'Core',
    updated: '2m',
    description: 'Modals render offset when the OverlayRoot host has flex layout. Repro: open Drawer + Modal back-to-back. Fix lands with the inline-style backdrop rectangle.',
  },
  {
    id: 'VYU-127',
    title: 'Bottom dock loses tab state when island remounts',
    status: 'todo',
    priority: 'high',
    assignee: 'kealan',
    project: 'UI',
    updated: '14m',
    description: 'When the dock IslandGroup unmounts (e.g. after closing a sheet) the active `value` resets to `null`. Lift state to the parent or hoist into a composable.',
  },
  {
    id: 'VYU-126',
    title: 'DropdownMenu trigger should respect align="end"',
    status: 'in-review',
    priority: 'high',
    assignee: 'vyui',
    project: 'UI',
    updated: '1h',
    description: 'Account meatball dropdown on the linear-demo opens flush-left even when `content.align = "end"` is passed. Backdrop padding math drops the trigger rect right edge.',
  },
  {
    id: 'VYU-125',
    title: 'Sheet content header throws bind-of-undefined on MT',
    status: 'in-progress',
    priority: 'urgent',
    assignee: 'kealan',
    project: 'Core',
    updated: '2h',
  },
  {
    id: 'VYU-124',
    title: 'Wire `useAppConfig` overrides for VyIsland radius',
    status: 'backlog',
    priority: 'medium',
    assignee: 'ada',
    project: 'UI',
    updated: '5h',
  },
  {
    id: 'VYU-123',
    title: 'Add Combobox keyboard navigation parity for web env',
    status: 'todo',
    priority: 'medium',
    assignee: 'grace',
    project: 'UI',
    updated: '1d',
  },
  {
    id: 'VYU-122',
    title: 'Skeleton shimmer animation drops frames on cold start',
    status: 'done',
    priority: 'low',
    assignee: 'vyui',
    project: 'Core',
    updated: '1d',
  },
  {
    id: 'VYU-121',
    title: 'IslandButton inherits size from parent — document the rule',
    status: 'done',
    priority: 'low',
    assignee: 'kealan',
    project: 'Docs',
    updated: '2d',
  },
  {
    id: 'VYU-120',
    title: 'FeedList virtualisation regression on long lists',
    status: 'backlog',
    priority: 'high',
    assignee: 'ada',
    project: 'Core',
    updated: '2d',
  },
  {
    id: 'VYU-119',
    title: 'Toast viewport stacking order on web env',
    status: 'todo',
    priority: 'none',
    assignee: 'grace',
    project: 'UI',
    updated: '3d',
  },
]

interface StatusMeta { label: string, icon: string, color: string }

export const statusMeta: Record<IssueStatus, StatusMeta> = {
  'backlog':     { label: 'Backlog',     icon: 'icon-park-outline:dot',         color: 'text-slate-400' },
  'todo':        { label: 'Todo',        icon: 'icon-park-outline:round',       color: 'text-slate-500' },
  'in-progress': { label: 'In Progress', icon: 'icon-park-outline:loading-one', color: 'text-amber-500' },
  'in-review':   { label: 'In Review',   icon: 'icon-park-outline:eyes',        color: 'text-violet-500' },
  'done':        { label: 'Done',        icon: 'icon-park-outline:check-one',   color: 'text-emerald-500' },
}

interface PriorityMeta { label: string, icon: string, color: string }

export const priorityMeta: Record<IssuePriority, PriorityMeta> = {
  urgent: { label: 'Urgent', icon: 'icon-park-outline:fire',         color: 'text-rose-500'  },
  high:   { label: 'High',   icon: 'icon-park-outline:up-one',       color: 'text-orange-500' },
  medium: { label: 'Medium', icon: 'icon-park-outline:right-one',    color: 'text-slate-500' },
  low:    { label: 'Low',    icon: 'icon-park-outline:down-one',     color: 'text-slate-400' },
  none:   { label: 'None',   icon: 'icon-park-outline:minus',        color: 'text-slate-300' },
}
