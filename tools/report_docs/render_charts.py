"""
Generator aset diagram alir (flowchart) sistem pemantauan nifas berbasis Matplotlib.
Menghasilkan aset PNG 300 DPI ke dalam folder docs/assets/ tanpa ketergantungan Node.js / Mermaid CLI.
"""
import sys
from pathlib import Path
from typing import Dict

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from tools.report_docs.flowchart_definitions import (
    build_flowchart_1_onboarding,
    build_flowchart_2_triage,
    build_flowchart_3_intervention,
    build_flowchart_master,
)
CHARTS = {
    "flowchart_1_onboarding": build_flowchart_1_onboarding,
    "flowchart_2_triage": build_flowchart_2_triage,
    "flowchart_3_intervention": build_flowchart_3_intervention,
    "flowchart_master": build_flowchart_master,
}


def render_all_charts(output_dir: Path) -> Dict[str, Path]:
    output_dir.mkdir(parents=True, exist_ok=True)
    results = {}
    for name, builder_fn in CHARTS.items():
        png_path = output_dir / f"{name}.png"
        print(f"Rendering {name} via Matplotlib (300 DPI) -> {png_path}...")
        fc = builder_fn()
        fc.render(png_path)
        size_kb = png_path.stat().st_size / 1024
        print(f"  Done: {png_path.name} ({size_kb:.1f} KB)")
        results[name] = png_path
    return results


if __name__ == "__main__":
    assets_dir = Path(__file__).resolve().parent.parent.parent / "docs" / "assets"
    render_all_charts(assets_dir)
