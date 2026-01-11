import { supabase } from './supabase'

export async function createPlayerStats(username: string) {
  const { data } = await supabase.auth.getUser()
  const user = data.user

  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('player_stats').insert({
    username,
  })

  if (error) throw error
}
