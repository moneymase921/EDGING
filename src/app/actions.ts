'use server';

import { SlipSnapshot, LegSnapshot } from '@/lib/types';
import { supabase } from '@/lib/supabase';

// Database row types
interface SlipRow {
  id: string;
  username: string;
  created_at: string;
  payout_multiplier_x: number;
  p_slip: number;
  ev: number;
  rtp: number;
  status: string;
  leg1_result: string | null;
  leg2_result: string | null;
  slip_result: string | null;
  realized_return_x: number | null;
  realized_profit_units: number | null;
}

interface LegRow {
  id: string;
  slip_id: string;
  leg_index: number;
  description: string | null;
  chosen_side: string;
  probability_source: string;
  p_chosen: number;
  p_imp: number | null;
  p_fair: number | null;
  vig_percent: number | null;
  probability_override_input: string | null;
  single_odds_input: string | null;
  over_odds_input: string | null;
  under_odds_input: string | null;
}

// Convert database rows to SlipSnapshot
function rowsToSlipSnapshot(slip: SlipRow, legs: LegRow[]): SlipSnapshot {
  const sortedLegs = legs.sort((a, b) => a.leg_index - b.leg_index);
  
  const legSnapshots: [LegSnapshot, LegSnapshot] = sortedLegs.map(leg => ({
    id: leg.id,
    description: leg.description || undefined,
    chosenSide: leg.chosen_side as 'over' | 'under',
    probabilitySource: leg.probability_source as 'override' | 'devigPair' | 'singleOdds',
    pChosen: leg.p_chosen,
    pImp: leg.p_imp || undefined,
    pFair: leg.p_fair || undefined,
    vigPercent: leg.vig_percent || undefined,
    probabilityOverrideInput: leg.probability_override_input || undefined,
    singleOddsInput: leg.single_odds_input || undefined,
    overOddsInput: leg.over_odds_input || undefined,
    underOddsInput: leg.under_odds_input || undefined,
  })) as [LegSnapshot, LegSnapshot];

  return {
    id: slip.id,
    createdAt: slip.created_at,
    payoutMultiplierX: slip.payout_multiplier_x,
    legs: legSnapshots,
    pSlip: slip.p_slip,
    ev: slip.ev,
    rtp: slip.rtp,
    status: slip.status as 'pending' | 'settled',
    leg1Result: slip.leg1_result as 'hit' | 'miss' | undefined,
    leg2Result: slip.leg2_result as 'hit' | 'miss' | undefined,
    slipResult: slip.slip_result as 'win' | 'loss' | undefined,
    realizedReturnX: slip.realized_return_x || undefined,
    realizedProfitUnits: slip.realized_profit_units || undefined,
  };
}

export async function loadSlips(username: string): Promise<SlipSnapshot[]> {
  if (!username) {
    return [];
  }

  // Fetch slips for this user
  const { data: slips, error: slipsError } = await supabase
    .from('slips')
    .select('*')
    .eq('username', username.toLowerCase())
    .order('created_at', { ascending: false });

  if (slipsError) {
    console.error('Error loading slips:', slipsError);
    return [];
  }

  if (!slips || slips.length === 0) {
    return [];
  }

  // Fetch all legs for these slips
  const slipIds = slips.map(s => s.id);
  const { data: legs, error: legsError } = await supabase
    .from('legs')
    .select('*')
    .in('slip_id', slipIds);

  if (legsError) {
    console.error('Error loading legs:', legsError);
    return [];
  }

  // Group legs by slip_id
  const legsBySlipId: Record<string, LegRow[]> = {};
  for (const leg of (legs || [])) {
    if (!legsBySlipId[leg.slip_id]) {
      legsBySlipId[leg.slip_id] = [];
    }
    legsBySlipId[leg.slip_id].push(leg);
  }

  // Convert to SlipSnapshots
  return slips.map(slip => rowsToSlipSnapshot(slip, legsBySlipId[slip.id] || []));
}

export async function saveSlip(username: string, slip: SlipSnapshot): Promise<void> {
  if (!username) {
    throw new Error('Username is required');
  }

  // Insert the slip
  const { data: insertedSlip, error: slipError } = await supabase
    .from('slips')
    .insert({
      username: username.toLowerCase(),
      created_at: slip.createdAt,
      payout_multiplier_x: slip.payoutMultiplierX,
      p_slip: slip.pSlip,
      ev: slip.ev,
      rtp: slip.rtp,
      status: slip.status,
      leg1_result: slip.leg1Result || null,
      leg2_result: slip.leg2Result || null,
      slip_result: slip.slipResult || null,
      realized_return_x: slip.realizedReturnX || null,
      realized_profit_units: slip.realizedProfitUnits || null,
    })
    .select()
    .single();

  if (slipError) {
    console.error('Error saving slip:', slipError);
    throw new Error('Failed to save slip');
  }

  // Insert the legs
  const legsToInsert = slip.legs.map((leg, index) => ({
    slip_id: insertedSlip.id,
    leg_index: index,
    description: leg.description || null,
    chosen_side: leg.chosenSide,
    probability_source: leg.probabilitySource,
    p_chosen: leg.pChosen,
    p_imp: leg.pImp || null,
    p_fair: leg.pFair || null,
    vig_percent: leg.vigPercent || null,
    probability_override_input: leg.probabilityOverrideInput || null,
    single_odds_input: leg.singleOddsInput || null,
    over_odds_input: leg.overOddsInput || null,
    under_odds_input: leg.underOddsInput || null,
  }));

  const { error: legsError } = await supabase
    .from('legs')
    .insert(legsToInsert);

  if (legsError) {
    console.error('Error saving legs:', legsError);
    // Try to clean up the slip if legs failed
    await supabase.from('slips').delete().eq('id', insertedSlip.id);
    throw new Error('Failed to save slip legs');
  }
}

export async function updateSlip(username: string, updatedSlip: SlipSnapshot): Promise<void> {
  if (!username) {
    throw new Error('Username is required');
  }

  // First verify this slip belongs to the user
  const { data: existingSlip, error: fetchError } = await supabase
    .from('slips')
    .select('id, username')
    .eq('id', updatedSlip.id)
    .single();

  if (fetchError || !existingSlip) {
    throw new Error('Slip not found');
  }

  if (existingSlip.username.toLowerCase() !== username.toLowerCase()) {
    throw new Error('Unauthorized');
  }

  // Update the slip
  const { error: updateError } = await supabase
    .from('slips')
    .update({
      status: updatedSlip.status,
      leg1_result: updatedSlip.leg1Result || null,
      leg2_result: updatedSlip.leg2Result || null,
      slip_result: updatedSlip.slipResult || null,
      realized_return_x: updatedSlip.realizedReturnX || null,
      realized_profit_units: updatedSlip.realizedProfitUnits || null,
    })
    .eq('id', updatedSlip.id);

  if (updateError) {
    console.error('Error updating slip:', updateError);
    throw new Error('Failed to update slip');
  }
}

export async function deleteSlip(username: string, id: string): Promise<void> {
  if (!username) {
    throw new Error('Username is required');
  }

  // First verify this slip belongs to the user
  const { data: existingSlip, error: fetchError } = await supabase
    .from('slips')
    .select('id, username')
    .eq('id', id)
    .single();

  if (fetchError || !existingSlip) {
    throw new Error('Slip not found');
  }

  if (existingSlip.username.toLowerCase() !== username.toLowerCase()) {
    throw new Error('Unauthorized');
  }

  // Delete the slip (legs will cascade delete)
  const { error: deleteError } = await supabase
    .from('slips')
    .delete()
    .eq('id', id);

  if (deleteError) {
    console.error('Error deleting slip:', deleteError);
    throw new Error('Failed to delete slip');
  }
}
