/**
 * Merged seismic data for Salton Sea candidate sites.
 *
 * Primary PGV mean: Rekoske et al. (2023) 3-D physics-based simulation
 *   doi:10.1029/2023JB026975
 *   Run scripts/extract_pgv.py with 3d_1400.hdf5 + 3d_500a.hdf5 to refresh.
 *
 * Distribution shape (p50/p84/p95/max): iPOD ROM built from Scripps LOH dataset
 *   Method: interpolated POD + thin-plate-spline RBF, 500-scenario ensemble
 *   Run scripts/seismic_rom.py --data loh.hdf5 to refresh.
 *
 * When Rekoske data is present (placeholder:false), the iPOD distribution is
 * scaled so its mean matches the Rekoske physics-based mean, preserving the
 * relative hazard spread from the ensemble.
 */

import romResults from './seismic_rom_results.json'
import rekoskeResults from './rekoske_pgv_results.json'
import { ROMSeismicData } from '@/lib/types'

type RawIPOD = {
  pgv_mean_cm_s: number
  pgv_p50_cm_s: number
  pgv_p84_cm_s: number
  pgv_p95_cm_s: number
  pgv_max_cm_s: number
  n_scenarios: number
}

type RawRekoske = {
  pgv_mean_cm_s: number
  pga_approx_g: number
}

function mergeSeismic(ipod: RawIPOD, rekoske: RawRekoske | undefined): ROMSeismicData {
  if (!rekoske) {
    return {
      pgvMeanCmS: ipod.pgv_mean_cm_s,
      pgvP50CmS:  ipod.pgv_p50_cm_s,
      pgvP84CmS:  ipod.pgv_p84_cm_s,
      pgvP95CmS:  ipod.pgv_p95_cm_s,
      pgvMaxCmS:  ipod.pgv_max_cm_s,
      nScenarios: ipod.n_scenarios,
    }
  }

  // Scale the iPOD distribution shape to anchor on the Rekoske physics mean.
  // Avoids division-by-zero if iPOD mean is somehow 0.
  const scale = ipod.pgv_mean_cm_s > 0
    ? rekoske.pgv_mean_cm_s / ipod.pgv_mean_cm_s
    : 1

  return {
    pgvMeanCmS: round2(rekoske.pgv_mean_cm_s),
    pgvP50CmS:  round2(ipod.pgv_p50_cm_s * scale),
    pgvP84CmS:  round2(ipod.pgv_p84_cm_s * scale),
    pgvP95CmS:  round2(ipod.pgv_p95_cm_s * scale),
    pgvMaxCmS:  round2(ipod.pgv_max_cm_s * scale),
    nScenarios: ipod.n_scenarios,
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

const ipodRaw  = romResults.sites as Record<string, RawIPOD>
const rekoskeRaw = rekoskeResults.sites as Record<string, RawRekoske>

export const ROM_SEISMIC: Record<string, ROMSeismicData> = Object.fromEntries(
  Object.entries(ipodRaw).map(([id, ipod]) => [
    id,
    mergeSeismic(ipod, rekoskeRaw[id]),
  ])
)

export const ROM_META = {
  model:          romResults.model,
  source:         romResults.source_dataset,
  rekoskeSource:  rekoskeResults.source,
  isPlaceholder:  (rekoskeResults as { placeholder?: boolean }).placeholder ?? false,
  nTraining:      romResults.n_training,
  nScenarios:     romResults.n_scenarios,
  eqParams:       romResults.earthquake_params,
}
