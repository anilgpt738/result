# Design Decisions Needing Approval (design_decisions_needing_approval.md)

**Project:** Usha Institute of Computer Education — Website & ERP v2.0  
**Design System Reference:** Section 7 of Master Build Prompt & Usha Institute Style Guide  
**Status:** Submitted for Owner Review & Sign-Off  

---

## 1. Derived Component States (Built from Strict Style Guide Tokens)

The following UI component states have been derived strictly from the official style guide tokens (`--maroon: #890C25`, `--dark: #181818`, `--lavender: #F5F3FF`, `--ink: #110C2D`, `--body: #737477`, `--border: #DCDBE4`, `--maroon-tint: #F0E5E9`):

| State | Implementation Rule | Token Mapping | Decision Needing Approval |
| :--- | :--- | :--- | :--- |
| **Interactive Focus** | `outline: 2px solid var(--maroon); outline-offset: 2px;` | Maroon #890C25 | Standardized across all inputs, links, and buttons. Approve keyboard navigation indicator. |
| **Form Validation Error** | Text in Maroon #890C25, 1px border in Maroon, accompanied by an explicit error icon and clear text description (never color alone). | Maroon #890C25 | Meets WCAG AA contrast. Confirm this treatment for inline field errors. |
| **Disabled Controls** | Background in Lavender #F5F3FF, text in Border grey #DCDBE4, cursor not-allowed. | Lavender #F5F3FF & Border #DCDBE4 | Confirm disabled appearance for buttons and inputs. |
| **Loading Indicators** | Thin Maroon circular spinner (`border-top: 2px solid var(--maroon)`) and Lavender pulsing skeleton blocks for cards/tables. | Maroon & Lavender | Confirm skeleton loading blocks on data tables and fee cards. |
| **Success & Notice Alerts** | Near-black text #181818 on Maroon-tint #F0E5E9 background with icon. | Near-black #181818 on Maroon-tint #F0E5E9 | Uses only style guide tokens without introducing arbitrary green alerts. |

---

## 2. Status Badges & Color Usage in Admin/Portals

In the style guide, the token set does not include green or amber. Section 7.3 notes:
> *"Status badges (paid, pending, overdue, verified, rejected, issued, revoked): small pills in maroon, near-black and lavender, with the status written in words. Muted green and amber may be used only inside these badges, and only if the owner approves."*

### Proposed Options for Owner Sign-Off:

* **Option A (Strict Token Palette - Default):**
  * `Paid / Verified / Issued`: Near-black pill (`background: #181818; color: #FFFFFF; font-weight: 600;`)
  * `Pending / Under Verification`: Lavender pill (`background: #F5F3FF; color: #890C25; border: 1px solid #890C25;`)
  * `Overdue / Rejected / Revoked`: Maroon pill (`background: #890C25; color: #FFFFFF; font-weight: 600;`)
* **Option B (Muted Semantic Status Accents):**
  * `Paid / Verified`: Muted Forest Green (`#166534`, background `#DCFCE7`)
  * `Pending / Under Verification`: Muted Amber (`#92400E`, background `#FEF3C7`)
  * `Overdue / Revoked`: Muted Maroon (`#890C25`, background `#FEE2E2`)

*Recommendation:* Use Option B inside admin tables for maximum operator clarity, while keeping Option A for public-facing badges.

---

## 3. Container Width & Navigation Breakpoints

* **Container Width:** The style guide showed both 1180px in its preview and 1280px in its token block. Per Section 7.1, we have adopted `1280px` as the canonical max-width with 22px side padding.
* **Mobile Drawer Breakpoint:** Header hamburger drawer triggers at `< 1024px` to accommodate the rich navigation hierarchy (Courses dropdown, Admissions dropdown, Verification dropdown) comfortably on tablets and mobile screens.
* **Header Button:** A single pill `[Apply Now]` is visible on all viewport sizes, conforming to the "One primary button per section" design mandate.
