# Shadcn UI Audit

This audit captures the shared UI cleanup target for the `beads-task-issue-tracker-8xc` migration work.

## Goal

Move the app toward default `shadcn-vue` primitives and screen-level composition with as little custom presentation logic as possible.

## Keep As Thin Shadcn Adapters

These files already look like standard shadcn wrappers or generated support code and should remain in `app/components/ui` with only minimal maintenance:

- `app/components/ui/avatar/*`
- `app/components/ui/badge/*`
- `app/components/ui/breadcrumb/*`
- `app/components/ui/button/*`
- `app/components/ui/card/*`
- `app/components/ui/checkbox/*`
- `app/components/ui/collapsible/*`
- `app/components/ui/dialog/*`
- `app/components/ui/dropdown-menu/*`
- `app/components/ui/input/*`
- `app/components/ui/label/*`
- `app/components/ui/scroll-area/*`
- `app/components/ui/select/*`
- `app/components/ui/separator/*`
- `app/components/ui/sheet/*`
- `app/components/ui/sidebar/*`
- `app/components/ui/skeleton/*`
- `app/components/ui/sonner/*`
- `app/components/ui/table/*`
- `app/components/ui/tabs/*`
- `app/components/ui/textarea/*`
- `app/components/ui/tooltip/*`

## Keep But Reclassify As App Components

These are useful, but they are not thin primitives. They should stay for now, but they should be treated as app-level composites instead of part of the design-system foundation:

- `app/components/ui/confirm-dialog/ConfirmDialog.vue`
  Uses shadcn dialog/button primitives, but bakes in app copy, action layout, loading treatment, and destructive iconography.
- `app/components/ui/copyable-id/CopyableId.vue`
  Helpful utility component, but it is domain-specific and not a reusable shadcn primitive.
- `app/components/ui/image-preview/*`
  Feature-oriented media viewer rather than a primitive.
- `app/components/ui/linkified-text/LinkifiedText.vue`
  Rich text rendering helper, not a primitive.
- `app/components/ui/markdown-preview/*`
  Feature-level markdown preview dialog.
- `app/components/ui/notification-toast/NotificationToast.vue`
  App-specific toast presentation layered on top of `sonner`.
- `app/components/ui/label-multiselect/LabelMultiSelect.vue`
  Currently a custom combobox/dropdown built from raw HTML instead of a stock shadcn pattern.
- `app/components/ui/chart/*`
  Specialized chart integration layer and currently blocked by a separate type issue around `@unovis/vue`.

## Highest-Priority Presentation Customizations To Remove

The largest divergence from default shadcn styling lives in `app/assets/css/tailwind.css` and the issue badge components.

- Remove legacy badge gradient classes such as `.badge-gradient`, `.bg-status-*-gradient`, `.bg-type-*-gradient`, and `.bg-priority-*-gradient`.
- Remove the large badge-specific CSS variable matrix such as `--badge-status-*`, `--badge-type-*`, and `--badge-priority-*`.
- Remove the legacy `data-theme="neon"` override block. `useTheme.ts` already migrates legacy `neon` users to `dark`, so the CSS is dead weight for the new design-system direction.
- Remove custom light and dark badge overrides that flatten or restyle the gradient classes per theme.
- Revisit global scrollbar styling and VS Code-inspired palette overrides only after screen migrations are complete. They are broader app-theming decisions, not primitive-level necessities.

## Components That Should Simplify During Screen Migration

These screen-facing components still encode custom presentation decisions that should be replaced with default shadcn variants and utility classes closer to usage sites:

- `app/components/issues/StatusBadge.vue`
  Replace gradient/status theme classes with standard `Badge` variants or small local utility mappings.
- `app/components/issues/PriorityBadge.vue`
  Same cleanup as status badges.
- `app/components/issues/TypeBadge.vue`
  Same cleanup as status badges.
- `app/components/issues/LabelBadge.vue`
  Still derives custom palettes from theme state and should be normalized to simpler badge styling.
- `app/components/ui/label-multiselect/LabelMultiSelect.vue`
  Should migrate toward a standard shadcn popover/command or select-style interaction rather than bespoke dropdown markup.

## Suggested Follow-On Order

- Migrate the issue badge components away from gradient classes first.
- Remove the now-unused badge and neon theme CSS from `app/assets/css/tailwind.css` immediately after those badge updates land.
- Rework `LabelMultiSelect` into a stock shadcn interaction pattern before detail-form migration is considered complete.
- Keep chart cleanup separate from this styling migration because the `@unovis/vue` typing problem is an independent blocker.

## Summary

The shared primitive layer is mostly in good shape. The main remaining migration debt is not the generated shadcn wrappers themselves, but the custom theme system, gradient badge styling, and a handful of app-specific composites currently living under `app/components/ui`.
