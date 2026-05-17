import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://eddugqmibbysritjpufy.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZHVncW1pYmJ5c3JpdGpwdWZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MzY3NjMsImV4cCI6MjA5NDExMjc2M30.WYbrR9ScbBQqvDoSaGpQ2SbzoD_JLFwmYw5Te-JCHqQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
