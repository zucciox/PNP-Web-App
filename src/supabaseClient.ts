import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://ftqsassevxvtwydllccq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0cXNhc3Nldnh2dHd5ZGxsY2NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NTYyMTUsImV4cCI6MjA5MTIzMjIxNX0.m9qlGx8NPV6G2yURBlhrWFsHkcZudCZwAu-ylVFZen0'
export const supabase = createClient(supabaseUrl, supabaseAnonKey)