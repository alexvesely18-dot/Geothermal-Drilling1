#!/usr/bin/env python3
"""
GeoPivot Seismic ROM
iPOD reduced-order model using the Scripps LOH demonstration dataset.
Computes per-site PGV statistics for Salton Sea candidate zones.

Requirements: h5py numpy scipy scikit-learn
Usage: python scripts/seismic_rom.py --data loh.hdf5 --output data/seismic_rom_results.json
"""

import argparse
import json
import sys

import h5py
import numpy as np
from scipy.interpolate import RBFInterpolator
from sklearn.model_selection import train_test_split

# ─── LOH Grid ────────────────────────────────────────────────────────────────
# 30 x 30 km domain, 60 x 60 receiver grid
GRID_X = np.linspace(0, 30, 60)   # Easting  (km)
GRID_Y = np.linspace(0, 30, 60)   # Northing (km)

# ─── Salton Sea Site Grid Positions ──────────────────────────────────────────
# Grid center (15, 15) represents the fault trace.
# Sites are placed at their measured fault distances along a representative
# azimuth (perpendicular to the NW-SE trending fault).
SITES = {
    "brawley-zone": {
        "name": "Brawley Seismic Zone",
        "fault_distance_km": 1.3,
        "grid_x": 16.3,
        "grid_y": 15.0,
    },
    "salton-sea-geothermal": {
        "name": "Salton Sea Geothermal Field",
        "fault_distance_km": 2.1,
        "grid_x": 17.1,
        "grid_y": 15.0,
    },
    "calipatria-north": {
        "name": "Calipatria North Zone",
        "fault_distance_km": 5.8,
        "grid_x": 20.8,
        "grid_y": 15.0,
    },
    "east-mesa": {
        "name": "East Mesa",
        "fault_distance_km": 8.2,
        "grid_x": 23.2,
        "grid_y": 15.0,
    },
    "heber": {
        "name": "Heber Geothermal Field",
        "fault_distance_km": 12.4,
        "grid_x": 15.0,
        "grid_y": 2.6,   # 12.4 km south of fault center
    },
}

# ─── Salton Sea Earthquake Ensemble ──────────────────────────────────────────
# Source parameters representative of Imperial Valley seismicity:
#   depth  : 5–15 km (typical crustal events)
#   strike : 310–330° (NW-SE San Andreas system)
#   dip    : 75–90°   (near-vertical strike-slip)
#   rake   : 160–180° (right-lateral)
SALTON_PARAMS = {
    "depth_range":  (5.0,  15.0),
    "strike_range": (310.0, 330.0),
    "dip_range":    (75.0,  90.0),
    "rake_range":   (160.0, 180.0),
}


def grid_index(x_km: float, y_km: float) -> int:
    """Flatten (x, y) km coordinates to a single grid index."""
    xi = int(round(np.clip(x_km / 30.0 * 59, 0, 59)))
    yi = int(round(np.clip(y_km / 30.0 * 59, 0, 59)))
    return yi * 60 + xi


def build_rom(hdf5_path: str, n_samples: int = 2000):
    print(f"  Loading HDF5 data ({n_samples} samples)…", flush=True)
    with h5py.File(hdf5_path, "r") as f:
        params = f["params"][:n_samples]
        data   = f["data"][:n_samples]

    X_train, X_test, y_train, y_test = train_test_split(
        params, data, test_size=0.1, random_state=0
    )

    print("  Computing SVD…", flush=True)
    u, s, _ = np.linalg.svd(y_train.T, full_matrices=False)

    # Relative information content — keep enough modes for 99.9 % RIC
    ric = np.cumsum(s ** 2) / np.sum(s ** 2)
    n_modes = int(np.searchsorted(ric, 0.999)) + 1
    print(f"  Using {n_modes} modes (99.9% RIC)", flush=True)
    u_r = u[:, :n_modes]

    a_train = y_train @ u_r

    print("  Training RBF interpolator (thin-plate spline)…", flush=True)
    rbf = RBFInterpolator(X_train, a_train)

    # Quick validation on test set
    a_pred  = rbf(X_test)
    y_pred  = a_pred @ u_r.T
    rel_err = np.mean(np.abs(y_test - y_pred)) / (np.mean(np.abs(y_test)) + 1e-12)
    print(f"  Test MAE / mean|y_test| = {rel_err:.4f}", flush=True)

    return u_r, rbf


def sample_scenarios(n: int = 500, seed: int = 42) -> np.ndarray:
    rng = np.random.default_rng(seed)
    p   = SALTON_PARAMS
    return np.column_stack([
        rng.uniform(*p["depth_range"],  n),
        rng.uniform(*p["strike_range"], n),
        rng.uniform(*p["dip_range"],    n),
        rng.uniform(*p["rake_range"],   n),
    ])


def compute_site_pgv(u_r, rbf, scenarios: np.ndarray) -> dict:
    print("  Predicting PGV maps…", flush=True)
    a_pred   = rbf(scenarios)
    pgv_maps = a_pred @ u_r.T          # (n_scenarios, 3600)

    results = {}
    for site_id, site in SITES.items():
        idx      = grid_index(site["grid_x"], site["grid_y"])
        pgv_vals = np.clip(pgv_maps[:, idx] * 100, 0, None)   # → cm/s

        results[site_id] = {
            "name":             site["name"],
            "fault_distance_km": site["fault_distance_km"],
            "pgv_mean_cm_s":    round(float(np.mean(pgv_vals)),       2),
            "pgv_p50_cm_s":     round(float(np.percentile(pgv_vals, 50)), 2),
            "pgv_p84_cm_s":     round(float(np.percentile(pgv_vals, 84)), 2),
            "pgv_p95_cm_s":     round(float(np.percentile(pgv_vals, 95)), 2),
            "pgv_max_cm_s":     round(float(np.max(pgv_vals)),         2),
            "n_scenarios":      int(len(scenarios)),
        }
        r = results[site_id]
        print(f"    {site['name']:<35}  mean={r['pgv_mean_cm_s']:6.1f}  "
              f"p84={r['pgv_p84_cm_s']:6.1f}  p95={r['pgv_p95_cm_s']:6.1f} cm/s")

    return results


def main():
    parser = argparse.ArgumentParser(description="Build iPOD ROM and compute Salton Sea site PGV")
    parser.add_argument("--data",        default="loh.hdf5",                    help="Path to loh.hdf5")
    parser.add_argument("--output",      default="data/seismic_rom_results.json", help="Output JSON path")
    parser.add_argument("--n-train",     type=int, default=2000,  help="Training samples (max 5000)")
    parser.add_argument("--n-scenarios", type=int, default=500,   help="Salton Sea ensemble size")
    args = parser.parse_args()

    print("=== GeoPivot Seismic ROM ===")
    print(f"HDF5 source : {args.data}")
    print(f"Output      : {args.output}")
    print()

    print("[1/3] Building ROM…")
    try:
        u_r, rbf = build_rom(args.data, args.n_train)
    except FileNotFoundError:
        print(f"ERROR: {args.data} not found. Download the Scripps LOH dataset first.")
        sys.exit(1)

    print("\n[2/3] Sampling Salton Sea earthquake scenarios…")
    scenarios = sample_scenarios(args.n_scenarios)
    print(f"  {args.n_scenarios} scenarios sampled")

    print("\n[3/3] Computing per-site PGV…")
    site_results = compute_site_pgv(u_r, rbf, scenarios)

    output = {
        "model":            "iPOD ROM — LOH forward model, thin-plate-spline RBF",
        "source_dataset":   "Scripps Institution of Oceanography loh.hdf5",
        "n_training":       args.n_train,
        "n_scenarios":      args.n_scenarios,
        "earthquake_params": SALTON_PARAMS,
        "sites":            site_results,
    }

    with open(args.output, "w") as fh:
        json.dump(output, fh, indent=2)
    print(f"\nResults written to {args.output}")


if __name__ == "__main__":
    main()
