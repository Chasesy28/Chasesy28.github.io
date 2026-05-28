import { beforeEach, describe, expect, it, vi } from 'vitest'

const getAnnouncementsMock = vi.fn()
const dismissAnnouncementMock = vi.fn()
const isAnnouncementDismissedMock = vi.fn()
const createAnnouncementMock = vi.fn()
const deleteAnnouncementMock = vi.fn()

vi.mock('./supabase.ts', () => ({
  getAnnouncements: getAnnouncementsMock,
  dismissAnnouncement: dismissAnnouncementMock,
  isAnnouncementDismissed: isAnnouncementDismissedMock,
  createAnnouncement: createAnnouncementMock,
  deleteAnnouncement: deleteAnnouncementMock
}))

import { AnnouncementsManager } from './announcements'

describe('AnnouncementsManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    localStorage.setItem('announcement_user_id', 'user_123')
  })

  it('filters out dismissed dismissible announcements', async () => {
    getAnnouncementsMock.mockResolvedValue([
      { id: 'keep-nondismissible', dismissible: false },
      { id: 'keep-active', dismissible: true },
      { id: 'hide-dismissed', dismissible: true }
    ])
    isAnnouncementDismissedMock.mockImplementation(async (id: string) => id === 'hide-dismissed')
    const manager = new AnnouncementsManager()

    const visible = await manager.getAnnouncements()

    expect(visible).toEqual([
      { id: 'keep-nondismissible', dismissible: false },
      { id: 'keep-active', dismissible: true }
    ])
    expect(isAnnouncementDismissedMock).toHaveBeenCalledWith('keep-active', 'user_123')
    expect(isAnnouncementDismissedMock).toHaveBeenCalledWith('hide-dismissed', 'user_123')
  })

  it('dispatches dismissal event when dismiss succeeds', async () => {
    dismissAnnouncementMock.mockResolvedValue(true)
    const manager = new AnnouncementsManager()
    const callback = vi.fn()
    manager.on('announcement:dismissed', callback)

    const result = await manager.dismiss('announcement-1')

    expect(result).toBe(true)
    expect(callback).toHaveBeenCalledWith({ announcementId: 'announcement-1' })
  })

  it('validates announcement type before create', async () => {
    const manager = new AnnouncementsManager()

    const result = await manager.create('test message', 'invalid-type')

    expect(result).toBeNull()
    expect(createAnnouncementMock).not.toHaveBeenCalled()
  })

  it('dispatches events for create and delete success', async () => {
    createAnnouncementMock.mockResolvedValue({ id: 'announcement-new', message: 'Hello' })
    deleteAnnouncementMock.mockResolvedValue(true)
    const manager = new AnnouncementsManager()
    const createListener = vi.fn()
    const deleteListener = vi.fn()
    manager.on('announcement:created', createListener)
    manager.on('announcement:deleted', deleteListener)

    const created = await manager.create('Hello', 'info', true, 'admin-1')
    const deleted = await manager.delete('announcement-new')

    expect(created).toEqual({ id: 'announcement-new', message: 'Hello' })
    expect(deleted).toBe(true)
    expect(createListener).toHaveBeenCalledWith({ id: 'announcement-new', message: 'Hello' })
    expect(deleteListener).toHaveBeenCalledWith({ announcementId: 'announcement-new' })
  })

  it('subscribes and unsubscribes custom listeners', () => {
    const manager = new AnnouncementsManager()
    const listener = vi.fn()
    const unsubscribe = manager.on('announcement:created', listener)

    window.dispatchEvent(new CustomEvent('announcement:created', { detail: { id: 'a1' } }))
    unsubscribe()
    window.dispatchEvent(new CustomEvent('announcement:created', { detail: { id: 'a2' } }))

    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith({ id: 'a1' })
  })
})
