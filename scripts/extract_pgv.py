"""
GeoPivot — PGV Extraction Script
Extracts Peak Ground Velocity values from Rekoske et al. (2023) HDF5 files
at the 5 Salton Sea geothermal site coordinates, writes data/rekoske_pgv_results.json,
and prints a ready-to-paste summary.

Citation:
    Rekoske, J. M., Gabriel, A.-A., & May, D. A. (2023).
    Instantaneous physics-based ground motion maps using reduced-order modeling.
    Journal of Geophysical Research: Solid Earth, 128, e2023JB026975.
    https://doi.org/10.1029/2023JB026975

Requirements:
    pip3 install h5py numpy scipy

Usage:
    python3 scripts/extract_pgv.py

Place this script OR run it from the repo root; HDF5 files can be anywhere —
update HDF5_DIR below to point at the folder containing them.
"""

import h5py
import json
import numpy as np
from pathlib import Path
from scipy.interpolate import RBFInterpolator

# ── Configuration ─────────────────────────────────────────────────────────────

# Folder containing the two HDF5 files (default: same directory as this script)
HDF5_DIR = Path(__file__).parent

# Output JSON written to data/ at the repo root
OUTPUT_PATH = Path(__file__).parent.parent / "data" / "rekoske_pgv_results.json"

# ── Site coordinates — must match data/sites.ts exactly ──────────────────────
SITES = [
    ("salton-sea-geothermal", "Salton Sea Geothermal Field", 33.15, -115.58),
    ("east-mesa",             "East Mesa",                   32.75, -115.45),
    ("heber",                 "Heber Geothermal Field",      32.73, -115.53),
    ("brawley-zone",          "Brawley Seismic Zone",        33.02, -115.52),
    ("calipatria-north",      "Calipatria North Zone",       33.12, -115.51),
]

# HDF5 scenario files (label → filename)
FILES = {
    "3d_1400": HDF5_DIR / "3d_1400.hdf5",
    "3d_500a": HDF5_DIR / "3d_500a.hdf5",
}


# ── Helpers ───────────────────────────────────────────────────────────────────

def inspect_file(path: Path):
    """Print the full structure of an HDF5 file so you can verify dataset names."""
    print(f"\n{'='*60}")
    print(f"  Inspecting: {path.name}")
    print(f"{'='*60}")
    with h5py.File(path, "r") as f:
        def visitor(name, obj):
            indent = "  " * name.count("/")
            if isinstance(obj, h5py.Dataset):
                arr = obj[...]
                print(f"{indent}[Dataset] {name}")
                print(f"{indent}          shape={obj.shape}  dtype={obj.dtype}")
                print(f"{indent}          min={np.nanmin(arr):.4f}  max={np.nanmax(arr):.4f}")
            elif isinstance(obj, h5py.Group):
                print(f"{indent}[Group]   {name}")
                for k, v in obj.attrs.items():
                    print(f"{indent}          attr: {k} = {v}")
        f.visititems(visitor)
        print("\n  Root attributes:")
        for k, v in f.attrs.items():
            print(f"    {k} = {v}")


def find_dataset(f: h5py.File, candidates: list[str]) -> str | None:
    """Return the first dataset key whose name (lowercased) ends with any candidate."""
    keys: list[str] = []
    f.visititems(lambda name, _: keys.append(name))
    for c in candidates:
        for k in keys:
            if k.lower().endswith(c.lower()):
                return k
    return None


def extract_pgv_at_sites(path: Path, sites) -> dict[str, float]:
    """
    Extract PGV at each site using RBF interpolation (thin-plate spline).
    Auto-detects coordinate and PGV dataset names.
    Returns {site_id: pgv_cm_s}.
    """
    with h5py.File(path, "r") as f:
        lon_key = find_dataset(f, ["lon", "longitude", "x", "X"])
        lat_key = find_dataset(f, ["lat", "latitude",  "y", "Y"])
        pgv_key = find_dataset(f, ["pgv", "PGV", "peak_ground_velocity", "ground_motion"])

        if not pgv_key:
            keys: list[str] = []
            f.visititems(lambda name, _: keys.append(name))
            print(f"\n  ⚠️  Cannot auto-detect PGV dataset in {path.name}.")
            print(f"     Available: {keys}")
            print(f"     Add the correct name to the pgv_candidates list above.")
            return {}

        print(f"  Datasets used: lon={lon_key}  lat={lat_key}  pgv={pgv_key}")

        lons = f[lon_key][...].flatten()
        lats = f[lat_key][...].flatten()
        pgv  = f[pgv_key][...].flatten()

        # Remove NaNs / infinities
        mask = np.isfinite(pgv) & np.isfinite(lons) & np.isfinite(lats)
        pts  = np.column_stack([lons[mask], lats[mask]])
        vals = pgv[mask]
        print(f"  Grid points: {pts.shape[0]}  |  PGV range: {vals.min():.4f}–{vals.max():.4f}")

        rbf = RBFInterpolator(pts, vals, kernel="thin_plate_spline", smoothing=0)

        results = {}
        for site_id, name, lat, lon in sites:
            val_raw = float(rbf([[lon, lat]]))
            # Convert to cm/s if value looks like it's in m/s (< 5 m/s is typical)
            val_cm_s = val_raw * 100 if val_raw < 5 else val_raw
            results[site_id] = round(val_cm_s, 3)
            print(f"    {name:35s}  PGV = {val_cm_s:.3f} cm/s")

        return results


def pgv_to_pga(pgv_cm_s: float, freq_hz: float = 2.0) -> float:
    """
    Approximate PGA from PGV: PGA ≈ 2π·f·PGV  (empirical, f≈2 Hz typical).
    Input: cm/s → Output: g
    """
    pgv_m_s = pgv_cm_s / 100
    pga_m_s2 = 2 * np.pi * freq_hz * pgv_m_s
    return round(pga_m_s2 / 9.81, 4)


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    # Step 1 — inspect files so the user can verify dataset names
    found = []
    for label, fpath in FILES.items():
        if fpath.exists():
            inspect_file(fpath)
            found.append(label)
        else:
            print(f"\n  ❌ File not found: {fpath}")
            print(f"     Set HDF5_DIR at the top of this script to the correct folder.")

    if not found:
        print("\n❌ No HDF5 files found. Exiting.")
        return

    # Step 2 — extract PGV per scenario
    scenario_pgv: dict[str, dict[str, float]] = {}  # {label: {site_id: pgv}}
    for label, fpath in FILES.items():
        if not fpath.exists():
            continue
        print(f"\n── Extracting from {fpath.name} ──────────────────────")
        scenario_pgv[label] = extract_pgv_at_sites(fpath, SITES)

    if not scenario_pgv:
        print("\n❌ No PGV values extracted.")
        return

    # Step 3 — build per-site summary (average across scenarios)
    output: dict = {
        "source": "Rekoske et al. (2023), JGR Solid Earth, doi:10.1029/2023JB026975",
        "models": list(scenario_pgv.keys()),
        "note": "PGV extracted via RBF interpolation at site coordinates; converted to cm/s.",
        "sites": {},
    }

    print(f"\n{'='*60}")
    print("  RESULTS SUMMARY")
    print(f"{'='*60}")

    for site_id, name, lat, lon in SITES:
        per_scenario = {
            label: vals[site_id]
            for label, vals in scenario_pgv.items()
            if site_id in vals
        }
        if not per_scenario:
            print(f"  {name}: no data")
            continue

        pgv_vals = list(per_scenario.values())
        pgv_mean = round(float(np.mean(pgv_vals)), 3)
        pga_g    = pgv_to_pga(pgv_mean)

        output["sites"][site_id] = {
            "name":           name,
            "lat":            lat,
            "lon":            lon,
            **{f"pgv_{label}_cm_s": v for label, v in per_scenario.items()},
            "pgv_mean_cm_s":  pgv_mean,
            "pga_approx_g":   pga_g,
        }
        print(f"  {name}")
        for label, v in per_scenario.items():
            print(f"    {label}: {v:.2f} cm/s")
        print(f"    mean:   {pgv_mean:.2f} cm/s  →  PGA ≈ {pga_g:.4f} g")

    # Step 4 — write JSON
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w") as fh:
        json.dump(output, fh, indent=2)
    print(f"\n✅ Written to {OUTPUT_PATH}")
    print("   Re-run `npm run build` to incorporate the new values.")


if __name__ == "__main__":
    main()
