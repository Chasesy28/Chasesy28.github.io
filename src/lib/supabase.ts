import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('Supabase credentials not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper function to get announcements
export async function getAnnouncements() {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching announcements:', error)
    return []
  }
}

// Helper function to dismiss an announcement
export async function dismissAnnouncement(announcementId: string, userIdentifier: string) {
  try {
    const { error } = await supabase
      .from('announcement_dismissals')
      .insert({
        announcement_id: announcementId,
        user_identifier: userIdentifier
      })

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error dismissing announcement:', error)
    return false
  }
}

// Helper function to check if an announcement is dismissed for a user
export async function isAnnouncementDismissed(announcementId: string, userIdentifier: string) {
  try {
    const { data, error } = await supabase
      .from('announcement_dismissals')
      .select('id')
      .eq('announcement_id', announcementId)
      .eq('user_identifier', userIdentifier)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return !!data
  } catch (error) {
    console.error('Error checking announcement dismissal:', error)
    return false
  }
}

// Helper function to authenticate admin
export async function authenticateAdmin(email: string) {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    if (data) {
      // Update last login
      await supabase
        .from('admin_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.id)

      return data
    }
    return null
  } catch (error) {
    console.error('Error authenticating admin:', error)
    return null
  }
}

// Helper function to create announcement
export async function createAnnouncement(message: string, type: string, createdBy: string | null) {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .insert({
        message,
        type,
        created_by: createdBy,
        dismissible: true,
        active: true
      })
      .select()

    if (error) throw error
    return data?.[0] || null
  } catch (error) {
    console.error('Error creating announcement:', error)
    return null
  }
}

// Helper function to delete announcement
export async function deleteAnnouncement(announcementId: string) {
  try {
    const { error } = await supabase
      .from('announcements')
      .update({ active: false })
      .eq('id', announcementId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting announcement:', error)
    return false
  }
}
