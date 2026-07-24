# UniPulse i18n Audit

Status: partial coverage. The app has locale files and many components use `t(...)`, but some user-facing strings remain hardcoded.

High-priority hardcoded areas:

- `src/components/DepartmentSelector.jsx`: selection titles, empty states, alerts, university abbreviations, console-facing Turkish debug text.
- `src/App.jsx`: onboarding/department selection labels and fallback user text.
- `src/pages/DepartmentPage.jsx`: modal titles and placeholders.
- `src/hooks/useDersler.js`: alert/error strings for course CRUD failures.
- `src/context/AuthContext.jsx`: several thrown auth messages and account deletion errors.
- `src/layout/AppShell.jsx`: welcome/onboarding text and department labels.
- `src/utils/clientLogger.js`: PostHog/admin screen names are intentionally Turkish today; these should become keyed labels if admin language changes are required.

App status:

- iOS UniPulse folder is present, but only a limited file set was visible in the first scan and no localization resources were found yet.
- Course screens need a focused pass because missing translations are concentrated there.
