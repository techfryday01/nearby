import { supabase } from './supabase';

export type LikeAction = 'like' | 'pass' | 'super_like';

export type ProcessLikeResult =
  | { authenticated: false; matched: false }
  | { authenticated: true; matched: boolean };

export async function processLikeAction(
  targetDiscoveryId: string,
  action: LikeAction,
): Promise<ProcessLikeResult> {
  const { data: authData, error: authError } = await supabase.auth.getSession();
  if (authError) throw authError;
  if (!authData.session) {
    return { authenticated: false, matched: false };
  }

  const { data, error } = await supabase.rpc('process_like', {
    target_profile_id: targetDiscoveryId,
    action,
  });
  if (error) throw error;
  if (typeof data !== 'boolean') {
    throw new Error('Matching RPC returned an unexpected result.');
  }

  return { authenticated: true, matched: data };
}
