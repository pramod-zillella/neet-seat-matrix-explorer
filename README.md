# NEET PG Seat Matrix Explorer

Compare the supplied **2025 and 2026** seat matrices for **Central / All India, Deemed and DNB**, including the separate file of seats added during 2025 counselling.

## Open it

Double-click **`Open Dashboard.cmd`**, or open **`index.html`** in Edge, Chrome or Firefox. The site works directly from disk and needs no server or Python installation for viewing.

The initial view shows all states, courses, matrices and quotas. It compares the original 2025 seats **plus 2025 additions** against the supplied 2026 matrices.

## Views and controls

- **College overview:** select a college and compare all its course/quota listings across the two years.
- **Compare colleges:** select multiple colleges and a course. Institution codes and addresses help distinguish campuses with similar names.
- **Explore a state:** select one state or all states, and optionally one or more courses.
- **Seat matrix:** select any combination of Central / All India, Deemed and DNB.
- **Allotment quota:** multi-select specific quotas, with Select all and Clear selection controls.
- **Show changes:** find increases, decreases, newly listed colleges, existing colleges, new courses at existing colleges, or colleges absent from the 2026 files.
- **Include 2025 additions:** checked by default. Uncheck it to compare the original 2025 matrix alone. The additions column remains visible and is marked excluded where applicable.
- **Continuous scrolling:** rows appear automatically as you scroll. Table headings stay visible, and Back to top returns to the beginning.
- **Search, sorting and CSV:** operate on all matching results, including rows not yet scrolled into view.
- **Copy view link:** after hosting, shares the selected filters and baseline choice. It does not save scroll position.

The table shows **2025 original → 2025 added → 2025 total → 2026 seats → seat change → percentage change → context**. A percentage is left blank when the 2025 comparison value is zero.

## Verified totals

| Matrix | 2025 original | 2025 additions | 2025 comparison | 2026 | Net change |
| --- | ---: | ---: | ---: | ---: | ---: |
| Central / All India | 12,678 | 195 | 12,873 | 14,113 | +1,240 |
| Deemed | 6,372 | 97 | 6,469 | 7,537 | +1,068 |
| DNB | 8,893 | 0 | 8,893 | 9,201 | +308 |
| **Total** | **27,943** | **292** | **28,235** | **30,851** | **+2,616** |

This is a **9.3%** increase against 2025 including the supplied additions. Against the original 2025 matrices alone, the increase is **2,908 seats**. No 2026 mid-counselling additions file was supplied. The files do not establish that the 2025 and 2026 snapshots represent the same counselling stage.

## Where the increase comes from

With all filters open and 2025 additions included:

| Contribution | Seats |
| --- | ---: |
| Seats at newly listed colleges/campuses | +1,343 |
| Positive changes at existing colleges | +3,594 |
| Negative changes at existing colleges retained in 2026 | −1,951 |
| 2025 seats at colleges absent from the 2026 files | −370 |
| **Overall net change** | **+2,616** |

There are **221 newly listed college/campus records** in the reviewed comparison. **726 existing colleges** have at least one positive row change. Existing colleges retained in 2026 have a net increase of **1,643** seats; their positive changes include **1,469 seats in new course listings**. Including baseline colleges absent from the 2026 files, the overall contribution from existing colleges is **+1,273** seats.

An increase/decrease is measured per **college × course × source matrix × quota**. A quota redistribution can therefore appear as both a positive and negative change; the net accounts for both. This is why the gross increments and the net increase are different.

“Newly listed college” means its reviewed identity does not appear anywhere in the selected 2025 baseline, before applying your filters. It does **not** mean the institution newly opened. A new course or DNB programme at a college that already appears in 2025 counts as growth at an existing college. Institutions with zero-seat rows in 2025 still count as previously listed; the top-level college counts count only colleges with positive matching seats.

“Not listed in 2026” is an observation about these files, not a conclusion that the college closed or seats were officially withdrawn.

## Source verification and matching

All seven CSV header layouts were checked explicitly. The parser fails if a header changes, a seat value is invalid, a quota/course is unmapped, or a repeated institute/course/quota/category key appears. It validates category-column sums against row totals and validates reported grand totals against detail rows.

The matrices contain different formats:

| File | Format | Seat field |
| --- | --- | --- |
| `2025_Seat_Matrix_All_India.csv` | Seat categories in columns; includes Institute Type | `TotalSeats` |
| `2025_Seat_Matrix_DNB.csv` | Seat categories in columns | `TotalSeats` |
| `2025_Seat_Matrix_Deemed.csv` | Institute, Program, Quota, total only | `Seats` |
| `2025_Seat_Matrix_Newly_Added.csv` | One category per row, with StateName and Branch | `TotalSeats` |
| `2026_Seat_Matrix_All_India.csv` | One category per row, with StateName and Branch | `TotalSeats` |
| `2026_Seat_Matrix_Deemed.csv` | One category per row, with StateName and Branch | `TotalSeats` |
| `2026_Seat_Matrix_DNB.csv` | Seat categories in columns; includes Institute Type | **`Total Seats`** |

Four files contain grand-total rows. Those rows are checked but **never added as seats again**. The 2025 additions file is treated as incremental seats and remains a separate component throughout the calculation. The 2025 Deemed file has no reserved-category breakdown, so the dashboard does not infer one.

Matrix grouping follows the source file. Some records in the All India files have a DNB Institute Type label while listing MD/MS courses and All India quota; these remain in the Central / All India source group. The additions file is assigned to its matching matrix using its InstituteType/quota. Management/Paid Seats Quota and Self-Financed Merit Seat are normalized to one quota label.

**College matching:** institute codes are the primary key. The build also applies **26 reviewed campus alias groups** covering renames, changed codes and college/hospital code pairs. Original codes remain visible and are preserved in the audit. **28 addition rows across six college names** lack codes; their codes are resolved using the named campuses in the supplied sources. Selected campus matches use additional address evidence from the earlier 2024/2025 allotment workbooks you supplied. These mappings are explicit and reviewable; there is no automatic fuzzy name merge. Other unrecognized code changes can still look like new/missing colleges.

**Course matching:** MCC codes bridge changed 2026 MD/MS labels to 2025 names. NBEMS spelling changes, ENT names, transfusion medicine variants and diploma naming variants are mapped explicitly. MD/MS, DNB and NBEMS diploma courses remain separate. The catalogue contains **99 courses**.

**States:** source StateName fields and explicit state names in institute addresses take priority. **58 reviewed state enrichments** use either identifiable address localities or exact normalized college names in the earlier cutoff dataset where all matching records agree on the state. Their evidence is bundled in `scripts/state_enrichment.json` and copied into the quality report. **Nine records remain under Unknown (not stated)**, so individual-state comparisons can omit these records; all-state totals include them.

See [data/quality-report.json](data/quality-report.json) for exact headers, source hashes, counts, totals, code resolutions, campus aliases, state evidence and remaining unknowns.

## Host on GitHub Pages

1. Create a public GitHub repository, for example `neet-seat-matrix-explorer`.
2. Extract `neet-seat-matrix-explorer-site.zip` to a new folder.
3. Upload the **extracted contents** to the repository root, keeping the `data` folder intact. `index.html` must be at the root.
4. Open **Settings → Pages**, choose **Deploy from a branch**, then **main** and **/ (root)**. Save.
5. Wait for deployment, then open the URL GitHub displays, normally `https://YOUR-USERNAME.github.io/neet-seat-matrix-explorer/`.
6. Choose filters and click **Copy view link** to share a particular comparison.

Required site files are `index.html`, `styles.css`, `app.js`, `core.js`, `favicon.svg`, `.nojekyll`, and the two files under `data`. Uploading the ZIP alone will not publish the site. GitHub Pages makes the site and bundled aggregate data public. This build has not published a repository or website.

## Rebuild from the source CSVs

Python 3.10+ is needed only to rebuild the data. The builder uses the Python standard library; there are no Python package dependencies.

```powershell
python scripts/build_data.py --source-dir 'C:\Users\pzillella\Downloads\Prompt Tuning_Dimitri Notebooks\Dimitri Notebooks\PersonalExperiments\SeatMatrix_2025_2026'
```

This reads the seven files and regenerates `data/seat-matrix.js` and `data/quality-report.json`. The source CSVs are not modified. The reviewed catalog and state enrichments live under `scripts`; retain them with the builder. If the source catalogue changes, review unmapped or ambiguous colleges/courses before updating these mappings.

## Validation

```powershell
python -m unittest discover -s tests -p 'test_*.py' -v
node --test --test-isolation=none tests/core.test.cjs
node scripts/browser_check.cjs
```

Data checks cover headers and totals, code/course mappings, degree separation, both baseline modes, growth reconciliation for every state and matrix, filter scope, and the distinction between new courses and new colleges. Browser checks use installed Microsoft Edge in a hidden local session and cover the three views, matrix and quota selections, baseline switches, shared filters, CSV export, continuous scrolling, mobile layout and direct-file launch.
