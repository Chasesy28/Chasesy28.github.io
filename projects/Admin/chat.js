import {
  getSession,
  getSessionExpirationMinutes,
  initializeAuthFromSupabase,
  isSupabaseConfigured,
  getSupabaseConfigError,
  loginWithGoogle,
  logout,
  refreshSession,
  supabase,
} from './panel-supabase.js'

const MESSAGE_LIMIT = 120
const CHAT_CHANNEL_NAME = 'admin-chat-messages'

const els = {
  badge: document.getElementById('chat-status-badge'),
  statusCopy: document.getElementById('chat-status-copy'),
  toolbarCopy: document.getElementById('chat-toolbar-copy'),
  connectionState: document.getElementById('chat-connection-state'),
  notice: document.getElementById('chat-notice'),
  messages: document.getElementById('messages'),
  composer: document.getElementById('composer'),
  messageInput: document.getElementById('message-input'),
  sendBtn: document.getElementById('send-btn'),
  signinBtn: document.getElementById('signin-btn'),
  signoutBtn: document.getElementById('signout-btn'),
  refreshBtn: document.getElementById('refresh-access'),
  sessionEmail: document.getElementById('session-email'),
  sessionExpires: document.getElementById('session-expires'),
  memberId: document.getElementById('member-id'),
}

const state = {
  access: 'checking',
  session: null,
  currentUser: null,
  memberRecord: null,
  messages: [],
  channel: null,
  loadingMessages: false,
}

function isMissingColumnError(error) {
  const message = String(error?.message ?? '').toLowerCase()
  return message.includes('column') && message.includes('does not exist')
}

function normalizeText(value) {
  if (typeof value === 'string') return value.trim()
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

function extractMemberId(member) {
  return member?.id ?? member?.user_id ?? member?.member_id ?? null
}

function extractMemberLabel(member) {
  return (
    normalizeText(member?.display_name) ||
    normalizeText(member?.name) ||
    normalizeText(member?.username) ||
    normalizeText(member?.email) ||
    normalizeText(member?.label) ||
    normalizeText(member?.id) ||
    'member'
  )
}

function extractMessageId(message) {
  return message?.id ?? null
}

function extractMessageAuthorId(message) {
  return (
    message?.member_id ??
    message?.user_id ??
    message?.author_id ??
    message?.sender_id ??
    message?.created_by ??
    null
  )
}

function extractMessageContent(message) {
  return (
    normalizeText(message?.content) ||
    normalizeText(message?.message) ||
    normalizeText(message?.body) ||
    normalizeText(message?.text) ||
    ''
  )
}

function extractMessageTimestamp(message) {
  return (
    message?.created_at ??
    message?.inserted_at ??
    message?.timestamp ??
    message?.sent_at ??
    message?.createdAt ??
    null
  )
}

function formatTimestamp(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function getSupabaseCallbackState() {
  const url = new URL(window.location.href)
  const searchParams = url.searchParams
  const hashParams = new URLSearchParams(url.hash.startsWith('#') ? url.hash.slice(1) : url.hash)

  const searchError = searchParams.get('error') || searchParams.get('error_code') || searchParams.get('error_description')
  const hashError = hashParams.get('error') || hashParams.get('error_code') || hashParams.get('error_description')
  const hasCode = searchParams.has('code')
  const hasAccessToken = hashParams.has('access_token')
  const hasCallbackMarkers = hasCode || hasAccessToken || searchParams.has('state') || Boolean(searchError || hashError)

  return {
    isRedirect: hasCallbackMarkers,
    hasSuccessMarker: hasCode || hasAccessToken,
    errorMessage: searchError || hashError || '',
  }
}

function clearSupabaseCallbackState() {
  const url = new URL(window.location.href)
  const paramsToRemove = ['code', 'state', 'error', 'error_code', 'error_description', 'token_hash', 'type']
  let changed = false

  for (const key of paramsToRemove) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key)
      changed = true
    }
  }

  if (url.hash) {
    const hashParams = new URLSearchParams(url.hash.startsWith('#') ? url.hash.slice(1) : url.hash)
    for (const key of ['access_token', 'refresh_token', 'expires_in', 'token_type', 'type', 'error', 'error_code', 'error_description']) {
      if (hashParams.has(key)) {
        hashParams.delete(key)
        changed = true
      }
    }

    const nextHash = hashParams.toString()
    if (nextHash) {
      url.hash = `#${nextHash}`
    } else if (hashParams.size > 0 || url.hash) {
      url.hash = ''
    }
  }

  if (changed) {
    const nextUrl = `${url.pathname}${url.search}${url.hash}`
    window.history.replaceState({}, document.title, nextUrl)
  }
}

function setBadge(kind, text) {
  els.badge.className = 'status-badge'
  if (kind === 'ready') els.badge.classList.add('is-ready')
  if (kind === 'locked') els.badge.classList.add('is-locked')
  if (kind === 'error') els.badge.classList.add('is-error')
  els.badge.textContent = text
}

function setNotice(message, kind = 'info') {
  if (!message) {
    els.notice.textContent = ''
    els.notice.classList.add('hidden')
    els.notice.classList.remove('error')
    return
  }

  els.notice.textContent = message
  els.notice.classList.remove('hidden')
  els.notice.classList.toggle('error', kind === 'error')
}

function setConnectionState(text) {
  els.connectionState.textContent = text
}

function setComposerEnabled(enabled) {
  els.composer.classList.toggle('hidden', !enabled)
  els.messageInput.disabled = !enabled
  els.sendBtn.disabled = !enabled
}

function setSignInControls(showSignIn, showSignOut) {
  els.signinBtn.classList.toggle('hidden', !showSignIn)
  els.signoutBtn.classList.toggle('hidden', !showSignOut)
}

function renderSessionSummary() {
  const session = getSession()
  state.session = session
  els.sessionEmail.textContent = session?.email ?? '-'
  els.sessionExpires.textContent = session ? String(getSessionExpirationMinutes() ?? 0) : '-'
  els.memberId.textContent = state.memberRecord ? extractMemberId(state.memberRecord) ?? '-' : '-'
}

function clearMessages() {
  els.messages.innerHTML = ''
}

function renderEmptyState(text) {
  clearMessages()
  const empty = document.createElement('div')
  empty.className = 'empty-state'
  empty.textContent = text
  els.messages.appendChild(empty)
}

function renderMessage(message) {
  const messageId = extractMessageId(message)
  const authorId = extractMessageAuthorId(message)
  const content = extractMessageContent(message)
  if (!content) return null

  const currentMemberId = extractMemberId(state.memberRecord)
  const isSelf = Boolean(currentMemberId && authorId && String(authorId) === String(currentMemberId))
  const authorLabel = isSelf ? 'You' : extractMemberLabel(state.memberRecord) && String(authorId) === String(currentMemberId)
    ? 'You'
    : String(authorId ?? 'member')

  const row = document.createElement('article')
  row.className = `message${isSelf ? ' self' : ''}`
  row.dataset.messageId = messageId ? String(messageId) : ''

  const meta = document.createElement('div')
  meta.className = 'message-meta'

  const name = document.createElement('span')
  name.className = 'message-name'
  name.textContent = authorLabel

  const time = document.createElement('span')
  time.className = 'message-time'
  time.textContent = formatTimestamp(extractMessageTimestamp(message))

  meta.append(name, time)

  const bubble = document.createElement('div')
  bubble.className = 'message-bubble'
  bubble.textContent = content

  row.append(meta, bubble)
  return row
}

function renderMessages(messages) {
  clearMessages()

  if (!messages.length) {
    renderEmptyState('No messages yet. Once someone in chat_members posts here, they will appear live in this stream.')
    return
  }

  const fragment = document.createDocumentFragment()
  for (const message of messages) {
    const node = renderMessage(message)
    if (node) fragment.appendChild(node)
  }
  els.messages.appendChild(fragment)
  els.messages.scrollTop = els.messages.scrollHeight
}

function sortMessages(messages) {
  return [...messages].sort((a, b) => {
    const timeA = new Date(extractMessageTimestamp(a) ?? 0).getTime()
    const timeB = new Date(extractMessageTimestamp(b) ?? 0).getTime()
    if (timeA !== timeB) return timeA - timeB
    const idA = String(extractMessageId(a) ?? '')
    const idB = String(extractMessageId(b) ?? '')
    return idA.localeCompare(idB)
  })
}

async function getCurrentSupabaseUser() {
  if (!supabase) return null
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data.user ?? null
}

async function findChatMember(identifier) {
  if (!supabase || !identifier) return null

  const queries = [
    supabase.from('chat_members').select('*').eq('id', identifier).maybeSingle(),
    supabase.from('chat_members').select('*').eq('user_id', identifier).maybeSingle(),
  ]

  for (const query of queries) {
    const { data, error } = await query
    if (data) return data
    if (error && !isMissingColumnError(error) && error.code !== 'PGRST116') {
      console.warn('Unable to inspect chat_members membership:', error)
    }
  }

  return null
}

async function resolveAccess(callbackState = getSupabaseCallbackState()) {
  if (!isSupabaseConfigured()) {
    state.access = 'error'
    setBadge('error', 'Supabase missing')
    setNotice(getSupabaseConfigError() || 'Supabase credentials are missing for this page.', 'error')
    setConnectionState('Unavailable')
    setComposerEnabled(false)
    setSignInControls(false, false)
    return
  }

  try {
    const authResult = await initializeAuthFromSupabase()
    if (authResult) refreshSession()
  } catch (error) {
    console.warn('Chat auth initialization failed:', error)
  }

  state.session = getSession()
  state.currentUser = await getCurrentSupabaseUser().catch(() => null)
  renderSessionSummary()

  if (!state.session || !state.currentUser) {
    state.access = 'signedOut'
    state.memberRecord = null
    setBadge('locked', 'Signed out')
    setNotice('Sign in with Google to unlock chat, then your member id must exist in chat_members.', 'info')
    setConnectionState('Signed out')
    setComposerEnabled(false)
    setSignInControls(true, false)
    setMessagePaneForLockedState()
    if (callbackState.isRedirect) {
      clearSupabaseCallbackState()
    }
    return
  }

  const memberCandidates = [state.session.adminId, state.currentUser.id]
    .map((value) => (value === null || value === undefined ? '' : String(value)))
    .filter(Boolean)

  let matchedMember = null
  for (const candidate of memberCandidates) {
    matchedMember = await findChatMember(candidate)
    if (matchedMember) break
  }

  if (!matchedMember) {
    state.access = 'unauthorized'
    state.memberRecord = null
    setBadge('locked', 'Not a member')
    setNotice('Your session is valid, but your id does not appear in chat_members.', 'error')
    setConnectionState('Access denied')
    setComposerEnabled(false)
    setSignInControls(false, true)
    setMessagePaneForLockedState()
    return
  }

  state.access = 'authorized'
  state.memberRecord = matchedMember
  renderSessionSummary()
  setBadge('ready', 'Chat ready')
  setNotice('', 'info')
  setConnectionState('Connected')
  setSignInControls(false, true)
  setComposerEnabled(true)
  els.toolbarCopy.textContent = `Chat is live for ${extractMemberLabel(matchedMember)}.`
  await loadMessages()
  startRealtime()

  if (callbackState.isRedirect) {
    clearSupabaseCallbackState()
  }
}

function setMessagePaneForLockedState() {
  if (state.channel) {
    supabase?.removeChannel(state.channel)
    state.channel = null
  }
  renderEmptyState('Chat is locked until you sign in and match an entry in chat_members.')
}

async function loadMessages() {
  if (!supabase || state.loadingMessages || state.access !== 'authorized') return
  state.loadingMessages = true

  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(MESSAGE_LIMIT)
    if (error) throw error
    state.messages = sortMessages(data ?? [])
    renderMessages(state.messages)
  } catch (error) {
    console.error('Unable to load chat messages:', error)
    renderEmptyState('Unable to load messages right now.')
    setNotice('The chat message feed could not be loaded.', 'error')
  } finally {
    state.loadingMessages = false
  }
}

function applyIncomingMessage(messageRow) {
  const normalizedId = extractMessageId(messageRow)
  if (normalizedId && state.messages.some((message) => String(extractMessageId(message)) === String(normalizedId))) {
    return
  }

  state.messages = sortMessages([...state.messages, messageRow])
  renderMessages(state.messages)
}

function startRealtime() {
  if (!supabase) return

  if (state.channel) {
    supabase.removeChannel(state.channel)
  }

  state.channel = supabase
    .channel(CHAT_CHANNEL_NAME)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      },
      (payload) => {
        if (state.access !== 'authorized') return
        applyIncomingMessage(payload.new)
      },
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setConnectionState('Live')
      } else if (status === 'CHANNEL_ERROR') {
        setConnectionState('Realtime error')
        setNotice('Realtime updates are unavailable right now.', 'error')
      }
    })
}

async function tryInsertMessage(content) {
  if (!supabase || !state.memberRecord) throw new Error('Chat is not available.')

  const memberId = extractMemberId(state.memberRecord)
  const payloads = [
    { content, user_id: memberId },
    { content, member_id: memberId },
    { message: content, user_id: memberId },
    { message: content, member_id: memberId },
  ]

  let lastError = null
  for (const payload of payloads) {
    const { error } = await supabase.from('messages').insert(payload)
    if (!error) return true
    lastError = error
    if (!isMissingColumnError(error)) {
      break
    }
  }

  throw lastError ?? new Error('Unable to send message.')
}

async function handleSendMessage(event) {
  event.preventDefault()

  if (state.access !== 'authorized') {
    setNotice('You do not have chat access.', 'error')
    return
  }

  const content = normalizeText(els.messageInput.value)
  if (!content) return

  els.sendBtn.disabled = true
  els.messageInput.disabled = true

  try {
    refreshSession()
    await tryInsertMessage(content)
    els.messageInput.value = ''
    await loadMessages()
  } catch (error) {
    console.error('Unable to send message:', error)
    setNotice(error instanceof Error ? error.message : 'Unable to send message.', 'error')
  } finally {
    els.sendBtn.disabled = false
    els.messageInput.disabled = false
    els.messageInput.focus()
  }
}

async function handleSignIn() {
  try {
    await loginWithGoogle(window.location.pathname)
  } catch (error) {
    setNotice(error instanceof Error ? error.message : 'Unable to start sign-in.', 'error')
  }
}

async function handleSignOut() {
  await logout()
  if (state.channel) {
    supabase?.removeChannel(state.channel)
    state.channel = null
  }
  state.memberRecord = null
  state.messages = []
  state.access = 'signedOut'
  renderSessionSummary()
  setBadge('locked', 'Signed out')
  setNotice('You have been signed out.', 'info')
  setConnectionState('Disconnected')
  setComposerEnabled(false)
  setSignInControls(true, false)
  setMessagePaneForLockedState()
}

async function bootstrap() {
  const callbackState = getSupabaseCallbackState()

  if (!isSupabaseConfigured()) {
    state.access = 'error'
    setBadge('error', 'Supabase missing')
    setNotice(getSupabaseConfigError() || 'Add Supabase credentials to enable chat.', 'error')
    setConnectionState('Unavailable')
    setComposerEnabled(false)
    setSignInControls(false, false)
    renderSessionSummary()
    setMessagePaneForLockedState()
    return
  }

  setBadge('locked', 'Checking access')
  setConnectionState('Checking')
  setComposerEnabled(false)
  setSignInControls(false, false)
  renderSessionSummary()
  els.statusCopy.textContent = callbackState.isRedirect
    ? callbackState.errorMessage
      ? `Supabase redirected back here with an auth error: ${callbackState.errorMessage}`
      : 'Supabase redirected back here. Verifying the session now.'
    : 'Verifying your session and membership.'
  renderEmptyState('Checking your session and chat membership...')

  els.signinBtn.addEventListener('click', handleSignIn)
  els.signoutBtn.addEventListener('click', handleSignOut)
  els.refreshBtn.addEventListener('click', resolveAccess)
  els.composer.addEventListener('submit', handleSendMessage)
  els.messageInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void handleSendMessage(event)
    }
  })

  await resolveAccess(callbackState)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap)
} else {
  void bootstrap()
}
