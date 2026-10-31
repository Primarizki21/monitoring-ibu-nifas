# Graph Report - .  (2026-10-31)

## Corpus Check
- 107 files · ~91,027 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 505 nodes · 1173 edges · 28 communities (18 shown, 10 thin omitted)
- Extraction: 85% EXTRACTED · 15% INFERRED · 0% AMBIGUOUS · INFERRED: 180 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Backend Python Database & Webhook|Backend Python Database & Webhook]]
- [[_COMMUNITY_Web Analytics & Header Navigation|Web Analytics & Header Navigation]]
- [[_COMMUNITY_Web UI Assets & Illustrations|Web UI Assets & Illustrations]]
- [[_COMMUNITY_Web Discharge & Cron API Routes|Web Discharge & Cron API Routes]]
- [[_COMMUNITY_Backend RBAC & Triage Dependencies|Backend RBAC & Triage Dependencies]]
- [[_COMMUNITY_Frontend Web Dependencies & Libraries|Frontend Web Dependencies & Libraries]]
- [[_COMMUNITY_Web Landing Page & Presentation|Web Landing Page & Presentation]]
- [[_COMMUNITY_Doc Tooling Chart Engine|Doc Tooling Chart Engine]]
- [[_COMMUNITY_Doc Tooling Project Charter Builder|Doc Tooling Project Charter Builder]]
- [[_COMMUNITY_Web TypeScript Configuration|Web TypeScript Configuration]]
- [[_COMMUNITY_Backend Faskes Master Endpoints|Backend Faskes Master Endpoints]]
- [[_COMMUNITY_Web Root Layout & Typography|Web Root Layout & Typography]]
- [[_COMMUNITY_Web Skeleton & Loading States|Web Skeleton & Loading States]]
- [[_COMMUNITY_Supabase Project Link Config|Supabase Project Link Config]]
- [[_COMMUNITY_Web ESLint Configuration|Web ESLint Configuration]]
- [[_COMMUNITY_Test User Account Generator|Test User Account Generator]]
- [[_COMMUNITY_Web Auth Route Middleware|Web Auth Route Middleware]]
- [[_COMMUNITY_Backend Pydantic Core Settings|Backend Pydantic Core Settings]]
- [[_COMMUNITY_Report Docs Package Init|Report Docs Package Init]]
- [[_COMMUNITY_Meta WhatsApp Webhook Verification|Meta WhatsApp Webhook Verification]]
- [[_COMMUNITY_Next.js Build Configuration|Next.js Build Configuration]]
- [[_COMMUNITY_PostCSS Style Configuration|PostCSS Style Configuration]]
- [[_COMMUNITY_Cron API GET Handler|Cron API GET Handler]]
- [[_COMMUNITY_Cron API POST Handler|Cron API POST Handler]]

## God Nodes (most connected - your core abstractions)
1. `Mother` - 32 edges
2. `StatusPemantauan` - 30 edges
3. `TriageResult` - 25 edges
4. `ScreeningSchedule` - 25 edges
5. `ScreeningLog` - 25 edges
6. `ScheduleStatus` - 23 edges
7. `MilestoneKF` - 22 edges
8. `EmergencyContact` - 20 edges
9. `build_project_charter_doc()` - 18 edges
10. `datetime` - 17 edges

## Surprising Connections (you probably didn't know these)
- `run_smoke_tests()` --calls--> `seed_database()`  [EXTRACTED]
  tests/smoke_test.py → app/db/seed.py
- `UserRole` --uses--> `UserRole`  [INFERRED]
  app/api/deps.py → app/models/enums.py
- `Session` --uses--> `StatusPemantauan`  [INFERRED]
  app/api/v1/faskes.py → app/models/enums.py
- `Session` --uses--> `TriageResult`  [INFERRED]
  app/api/v1/faskes.py → app/models/enums.py
- `Session` --uses--> `Mother`  [INFERRED]
  app/api/v1/faskes.py → app/models/mother.py

## Import Cycles
- 1-file cycle: `app/main.py -> app/main.py`
- 1-file cycle: `app/services/scheduler.py -> app/services/scheduler.py`

## Communities (28 total, 10 thin omitted)

### Community 0 - "Backend Python Database & Webhook"
Cohesion: 0.08
Nodes (78): Session, UUID, Request, Session, Session, lifespan(), MilestoneKF, Session (+70 more)

### Community 1 - "Web Analytics & Header Navigation"
Cohesion: 0.06
Nodes (46): GET(), Header(), inisial(), keluar(), NAMA_PERAN, FilterDashboard(), Opsi, GAYA_TOOLTIP (+38 more)

### Community 2 - "Web UI Assets & Illustrations"
Cohesion: 0.06
Nodes (45): NotFound(), IlustrasiJamPasir(), IlustrasiRumah(), IlustrasiSelesai(), Props, Logo(), LogoMark(), Badge() (+37 more)

### Community 3 - "Web Discharge & Cron API Routes"
Cohesion: 0.09
Nodes (33): jalankan(), antrekanNotifikasi(), DischargeBaru, gagal(), klienPengguna(), POST(), dischargeSchema, antrekanDarurat() (+25 more)

### Community 4 - "Backend RBAC & Triage Dependencies"
Cohesion: 0.14
Nodes (34): get_current_faskes_id(), get_current_user_id(), get_current_user_role(), UUID, Request, Session, TriageResult, UUID (+26 more)

### Community 5 - "Frontend Web Dependencies & Libraries"
Cohesion: 0.06
Nodes (33): dependencies, date-fns, @hookform/resolvers, lucide-react, motion, next, react, react-dom (+25 more)

### Community 6 - "Web Landing Page & Presentation"
Cohesion: 0.08
Nodes (14): metadata, PERAN, TANDA, WILAYAH, AdeganSubuh(), AlurKunjungan(), LANGKAH, HeroAdegan() (+6 more)

### Community 7 - "Doc Tooling Chart Engine"
Cohesion: 0.11
Nodes (19): Flowchart, Container, Edge, Flowchart, Node, Modul generator flowchart berbasis Matplotlib. Menghasilkan diagram alir determi, build_flowchart_1_onboarding(), build_flowchart_2_triage() (+11 more)

### Community 8 - "Doc Tooling Project Charter Builder"
Cohesion: 0.18
Nodes (22): Document, build_project_charter_doc(), Content definitions for Project Charter and Technical Specification., main(), add_callout(), add_chart_figure(), add_cover_page(), add_heading_2() (+14 more)

### Community 9 - "Web TypeScript Configuration"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 10 - "Backend Faskes Master Endpoints"
Cohesion: 0.29
Nodes (7): Session, get_faskes_detail(), get_faskes_summary(), list_faskes(), Mendapatkan daftar seluruh Rumah Sakit dan Puskesmas mitra di Surabaya., Mendapatkan detail fasilitas kesehatan berdasarkan ID., Ringkasan pemantauan maternal faskes: total pasien aktif dan sebaran kasus trias

### Community 11 - "Web Root Layout & Typography"
Cohesion: 0.33
Nodes (4): bricolage, jakarta, metadata, viewport

### Community 13 - "Supabase Project Link Config"
Cohesion: 0.40
Nodes (4): name, organization_id, organization_slug, ref

### Community 14 - "Web ESLint Configuration"
Cohesion: 0.40
Nodes (4): compat, __dirname, eslintConfig, __filename

## Knowledge Gaps
- **121 isolated node(s):** `Session`, `Path`, `Document`, `Path`, `Path` (+116 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createClient()` connect `Web Analytics & Header Navigation` to `Web UI Assets & Illustrations`, `Web Discharge & Cron API Routes`, `Web Landing Page & Presentation`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `formatWaktu()` connect `Web UI Assets & Illustrations` to `Web Analytics & Header Navigation`, `Web Discharge & Cron API Routes`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Why does `Mother` connect `Backend Python Database & Webhook` to `Backend Faskes Master Endpoints`, `Backend RBAC & Triage Dependencies`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Are the 21 inferred relationships involving `Mother` (e.g. with `Session` and `Session`) actually correct?**
  _`Mother` has 21 INFERRED edges - model-reasoned connections that need verification._
- **Are the 19 inferred relationships involving `StatusPemantauan` (e.g. with `Session` and `Session`) actually correct?**
  _`StatusPemantauan` has 19 INFERRED edges - model-reasoned connections that need verification._
- **Are the 14 inferred relationships involving `TriageResult` (e.g. with `Session` and `Request`) actually correct?**
  _`TriageResult` has 14 INFERRED edges - model-reasoned connections that need verification._
- **Are the 15 inferred relationships involving `ScreeningSchedule` (e.g. with `Session` and `UUID`) actually correct?**
  _`ScreeningSchedule` has 15 INFERRED edges - model-reasoned connections that need verification._