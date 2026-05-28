export type NotificationKind = 'mention' | 'assigned' | 'status' | 'comment' | 'release'

export interface Notification {
  id: string
  kind: NotificationKind
  actor: string
  message: string
  issueId: string
  time: string
  unread: boolean
}

export const notifications: Notification[] = [
  {
    id: 'n-12',
    kind: 'mention',
    actor: 'kealan',
    message: 'mentioned you on VYU-128 — “can you confirm the OverlayRoot fix lands today?”',
    issueId: 'VYU-128',
    time: '2m',
    unread: true,
  },
  {
    id: 'n-11',
    kind: 'assigned',
    actor: 'ada',
    message: 'assigned VYU-124 to you',
    issueId: 'VYU-124',
    time: '18m',
    unread: true,
  },
  {
    id: 'n-10',
    kind: 'status',
    actor: 'vyui-bot',
    message: 'moved VYU-126 to In Review',
    issueId: 'VYU-126',
    time: '1h',
    unread: true,
  },
  {
    id: 'n-9',
    kind: 'comment',
    actor: 'grace',
    message: 'commented on VYU-119 — “stacking on web is now ordered correctly.”',
    issueId: 'VYU-119',
    time: '3h',
    unread: false,
  },
  {
    id: 'n-8',
    kind: 'release',
    actor: 'vyui-bot',
    message: 'released @vyui/core 0.0.2 to npm',
    issueId: '',
    time: '6h',
    unread: false,
  },
  {
    id: 'n-7',
    kind: 'mention',
    actor: 'kealan',
    message: 'mentioned you on VYU-122 — “nice catch on the shimmer dropframe.”',
    issueId: 'VYU-122',
    time: '1d',
    unread: false,
  },
  {
    id: 'n-6',
    kind: 'assigned',
    actor: 'grace',
    message: 'requested review on VYU-123',
    issueId: 'VYU-123',
    time: '1d',
    unread: false,
  },
  {
    id: 'n-5',
    kind: 'status',
    actor: 'vyui-bot',
    message: 'closed VYU-121 as Done',
    issueId: 'VYU-121',
    time: '2d',
    unread: false,
  },
]

interface KindMeta { icon: string, color: string }

export const kindMeta: Record<NotificationKind, KindMeta> = {
  mention:  { icon: 'icon-park-outline:at-sign',         color: 'text-violet-500'  },
  assigned: { icon: 'icon-park-outline:user-positioning', color: 'text-blue-500'   },
  status:   { icon: 'icon-park-outline:transform',        color: 'text-amber-500'  },
  comment:  { icon: 'icon-park-outline:comments',         color: 'text-slate-500'  },
  release:  { icon: 'icon-park-outline:rocket-one',       color: 'text-emerald-500' },
}
