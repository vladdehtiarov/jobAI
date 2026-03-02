import { redirect } from 'next/navigation'
import { supabase } from './supabase-client'

export async function requireAuthClientSide() {
  const { data } = await supabase.auth.getSession()
  if (!data.session) redirect('/login')
  return data.session
}
