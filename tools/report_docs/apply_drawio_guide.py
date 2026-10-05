import xml.etree.ElementTree as ET
from pathlib import Path

def update_style_property(style_str: str, key: str, value: str) -> str:
    pairs = [p for p in style_str.split(";") if p.strip()]
    props = {}
    ordered_keys = []
    for p in pairs:
        if "=" in p:
            k, v = p.split("=", 1)
            props[k] = v
            ordered_keys.append(k)
        else:
            props[p] = True
            ordered_keys.append(p)
    
    props[key] = value
    if key not in ordered_keys:
        ordered_keys.append(key)
        
    res = []
    for k in ordered_keys:
        if props.get(k) is True:
            res.append(k)
        else:
            res.append(f"{k}={props[k]}")
    return ";".join(res) + ";"

def modify_flowchart_2(file_path: Path):
    """
    Flowchart 2: Onboarding & Scheduler
    - Faskes (Container 8): Left (x=40, y=40, w=320, h=545)
    - Backend (Container 2): Right (x=420, y=40, w=421, h=714)
    - Inter-phase Edge (12 -> 3): exitX=1;exitY=0.5;entryX=0;entryY=0.5;
    - Decision 4:
        4 -> 5 (Ya): exitX=0.5;exitY=1;entryX=0.5;entryY=0;
        4 -> 7 (Tidak): exitX=0;exitY=0.5;entryX=0.5;entryY=0;
    """
    tree = ET.parse(file_path)
    root = tree.getroot()

    # Move containers
    for uobj in root.iter("UserObject"):
        uid = uobj.get("id")
        cell = uobj.find("mxCell")
        if cell is not None and uid in ["8", "2"]:
            geom = cell.find("mxGeometry")
            if geom is not None:
                if uid == "8": # Faskes
                    geom.set("x", "40")
                    geom.set("y", "40")
                elif uid == "2": # Backend
                    geom.set("x", "420")
                    geom.set("y", "40")

    # Update edge ports
    for cell in root.iter("mxCell"):
        if cell.get("edge") == "1":
            s = cell.get("source")
            t = cell.get("target")
            style = cell.get("style", "")
            
            # Transition edge 12 -> 3 (Simpan Profil -> Scheduler)
            if s == "12" and t == "3":
                style = update_style_property(style, "exitX", "1")
                style = update_style_property(style, "exitY", "0.5")
                style = update_style_property(style, "entryX", "0")
                style = update_style_property(style, "entryY", "0.5")
                cell.set("style", style)
                
            # Decision 4 -> 5 (Ya)
            elif s == "4" and t == "5":
                style = update_style_property(style, "exitX", "0.5")
                style = update_style_property(style, "exitY", "1")
                style = update_style_property(style, "entryX", "0.5")
                style = update_style_property(style, "entryY", "0")
                cell.set("style", style)
                
            # Decision 4 -> 7 (Tidak / Standby)
            elif s == "4" and t == "7":
                style = update_style_property(style, "exitX", "0")
                style = update_style_property(style, "exitY", "0.5")
                style = update_style_property(style, "entryX", "0.5")
                style = update_style_property(style, "entryY", "0")
                cell.set("style", style)

    tree.write(file_path, encoding="utf-8", xml_declaration=False)
    print(f"Updated {file_path.name}")

def modify_flowchart_3(file_path: Path):
    """
    Flowchart 3: WhatsApp & Triase
    - WhatsApp (Container 11): Left (x=40, y=40, w=273, h=486)
    - Triase (Container 2): Right (x=360, y=40, w=706, h=685)
    - Inter-phase Edge (15 -> 3): exitX=1;exitY=0.5;entryX=0;entryY=0.5;
    - Decision 4 (Hasil Skrining):
        4 -> 9 (Bahaya/Merah - Kiri): exitX=0;exitY=0.5;entryX=0.5;entryY=0;
        4 -> 5 (Normal/Hijau - Tengah): exitX=0.5;exitY=1;entryX=0.5;entryY=0;
        4 -> 7 (Waspada/Kuning - Kanan): exitX=1;exitY=0.5;entryX=0.5;entryY=0;
    """
    tree = ET.parse(file_path)
    root = tree.getroot()

    # Move containers
    for uobj in root.iter("UserObject"):
        uid = uobj.get("id")
        cell = uobj.find("mxCell")
        if cell is not None and uid in ["11", "2"]:
            geom = cell.find("mxGeometry")
            if geom is not None:
                if uid == "11": # WhatsApp
                    geom.set("x", "40")
                    geom.set("y", "40")
                elif uid == "2": # Triase
                    geom.set("x", "360")
                    geom.set("y", "40")

    # Update edge ports
    for cell in root.iter("mxCell"):
        if cell.get("edge") == "1":
            s = cell.get("source")
            t = cell.get("target")
            style = cell.get("style", "")
            
            # Transition edge 15 -> 3 (Terima Respon -> Ekstraksi)
            if s == "15" and t == "3":
                style = update_style_property(style, "exitX", "1")
                style = update_style_property(style, "exitY", "0.5")
                style = update_style_property(style, "entryX", "0")
                style = update_style_property(style, "entryY", "0.5")
                cell.set("style", style)
                
            # Decision 4 -> 9 (Bahaya / Merah di x=41)
            elif s == "4" and t == "9":
                style = update_style_property(style, "exitX", "0")
                style = update_style_property(style, "exitY", "0.5")
                style = update_style_property(style, "entryX", "0.5")
                style = update_style_property(style, "entryY", "0")
                cell.set("style", style)

            # Decision 4 -> 5 (Normal / Hijau di x=277)
            elif s == "4" and t == "5":
                style = update_style_property(style, "exitX", "0.5")
                style = update_style_property(style, "exitY", "1")
                style = update_style_property(style, "entryX", "0.5")
                style = update_style_property(style, "entryY", "0")
                cell.set("style", style)

            # Decision 4 -> 7 (Waspada / Kuning di x=513)
            elif s == "4" and t == "7":
                style = update_style_property(style, "exitX", "1")
                style = update_style_property(style, "exitY", "0.5")
                style = update_style_property(style, "entryX", "0.5")
                style = update_style_property(style, "entryY", "0")
                cell.set("style", style)

    tree.write(file_path, encoding="utf-8", xml_declaration=False)
    print(f"Updated {file_path.name}")

def modify_flowchart_4(file_path: Path):
    """
    Flowchart 4: Intervensi Nakes & Siklus 42 Hari
    - Tindakan Nakes (Container 7): Left (x=40, y=40, w=407, h=739)
    - Siklus 42 Hari (Container 2): Right (x=490, y=40, w=431, h=603)
    - Inter-phase Edge (13 -> 3): exitX=1;exitY=0.5;entryX=0;entryY=0.5;
    - Decision 3:
        3 -> 4 (Belum / Standby di x=24): exitX=0;exitY=0.5;entryX=0.5;entryY=0;
        3 -> 5 (Ya / Selesai di x=245): exitX=0.5;exitY=1;entryX=0.5;entryY=0;
    """
    tree = ET.parse(file_path)
    root = tree.getroot()

    # Move containers
    for uobj in root.iter("UserObject"):
        uid = uobj.get("id")
        cell = uobj.find("mxCell")
        if cell is not None and uid in ["7", "2"]:
            geom = cell.find("mxGeometry")
            if geom is not None:
                if uid == "7": # Tindakan Nakes
                    geom.set("x", "40")
                    geom.set("y", "40")
                elif uid == "2": # Siklus 42 Hari
                    geom.set("x", "490")
                    geom.set("y", "40")

    # Update edge ports
    for cell in root.iter("mxCell"):
        if cell.get("edge") == "1":
            s = cell.get("source")
            t = cell.get("target")
            style = cell.get("style", "")
            
            # Transition edge 13 -> 3 (Update Rekam Medis -> Apakah >= 42 Hari)
            if s == "13" and t == "3":
                style = update_style_property(style, "exitX", "1")
                style = update_style_property(style, "exitY", "0.5")
                style = update_style_property(style, "entryX", "0")
                style = update_style_property(style, "entryY", "0.5")
                cell.set("style", style)
                
            # Decision 3 -> 4 (Belum di x=24)
            elif s == "3" and t == "4":
                style = update_style_property(style, "exitX", "0")
                style = update_style_property(style, "exitY", "0.5")
                style = update_style_property(style, "entryX", "0.5")
                style = update_style_property(style, "entryY", "0")
                cell.set("style", style)

            # Decision 3 -> 5 (Ya / Selesai di x=245)
            elif s == "3" and t == "5":
                style = update_style_property(style, "exitX", "0.5")
                style = update_style_property(style, "exitY", "1")
                style = update_style_property(style, "entryX", "0.5")
                style = update_style_property(style, "entryY", "0")
                cell.set("style", style)

    tree.write(file_path, encoding="utf-8", xml_declaration=False)
    print(f"Updated {file_path.name}")

if __name__ == "__main__":
    docs_dir = Path(__file__).resolve().parent.parent.parent / "docs"
    modify_flowchart_2(docs_dir / "Flowchart_2.drawio")
    modify_flowchart_3(docs_dir / "Flowchart_3.drawio")
    modify_flowchart_4(docs_dir / "Flowchart_4.drawio")
