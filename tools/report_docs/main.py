import os
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from tools.report_docs.builder import build_project_charter_doc

def main():
    assets_dir = ROOT_DIR / "docs" / "assets"
    default_output = ROOT_DIR / "docs" / "PROJECT_CHARTER_MONITORING_NIFAS.docx"
    output_path = Path(sys.argv[1]) if len(sys.argv) > 1 else default_output

    output_path.parent.mkdir(parents=True, exist_ok=True)
    print("Building Project Charter DOCX document with embedded flowcharts...")

    doc = build_project_charter_doc(assets_dir=assets_dir)
    doc.save(str(output_path))

    file_size_kb = output_path.stat().st_size / 1024
    print(f"Successfully generated: {output_path} ({file_size_kb:.1f} KB)")

if __name__ == "__main__":
    main()
