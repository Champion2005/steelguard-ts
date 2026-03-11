---
name: frontend-design
description: Produces polished, production-ready UI components and layouts using Tailwind CSS and Shadcn UI. Apply this skill when building pages, components, or UI systems. USE FOR creating React components, layouts, landing pages, dashboards, forms, navigation, interactive demos, and any visual UI work. Ensures good design principles — spacing, typography, color, hierarchy, responsiveness, and accessibility.
---

# Frontend Design Skill

Produce high-quality, visually polished UI using **Tailwind CSS** and **Shadcn UI**. This skill enforces good design principles throughout: consistent spacing, clear visual hierarchy, accessible contrast, and responsive layouts.

## Toolset

- **Tailwind CSS** — utility-first styling. Use it for all spacing, typography, color, layout.
- **Shadcn UI** — copy-paste component primitives (built on Radix UI). Prefer Shadcn components over custom-built ones for: buttons, inputs, dialogs, dropdowns, cards, tabs, tooltips.
- **Lucide React** — icon library that pairs with Shadcn.
- **CSS variables** — Shadcn uses CSS custom properties for theming. Use `--background`, `--foreground`, `--primary`, etc.

---

## Workflow

### Step 1: Understand Context

Before writing any code:
- What is this component/page for? (marketing, dashboard, form, demo)
- Dark or light mode, or both?
- Does a Shadcn component already solve this? (prefer reuse over custom)
- What data does it receive? What actions does it trigger?

### Step 2: Design Decisions First

Answer these before writing markup:
1. **Layout:** flex, grid, or stacked? How does it respond at mobile/tablet/desktop breakpoints?
2. **Hierarchy:** What is the primary action or content? What is secondary?
3. **Spacing rhythm:** Follow the 4/8px scale (`gap-4`, `p-6`, `mt-8`, etc.)
4. **Color palette:** Use `primary`, `muted`, `accent`, `destructive` from the theme. Avoid hardcoded hex values unless for a specific brand color.
5. **Typography scale:** Use Tailwind's type scale (`text-sm`, `text-base`, `text-xl`, `text-3xl`, etc.). Do not skip sizes arbitrarily.

### Step 3: Build Component

Follow this structure for every component:

```tsx
// 1. Imports (Shadcn, Lucide, then local)
// 2. Props interface (typed)
// 3. Component body — layout → structure → details
// 4. Export
```

Apply design principles as you build (see below).

### Step 4: Responsive Pass

After initial build:
- Apply mobile-first breakpoints (`sm:`, `md:`, `lg:`)
- Ensure tap targets are min 44×44px on mobile
- Stack horizontal layouts vertically on small screens
- Hide decorative elements on mobile if needed (`hidden sm:block`)

### Step 5: Accessibility Pass

- All interactive elements have `aria-label` or visible text
- Focus rings visible (Shadcn handles most, but verify)
- Color is never the only differentiator (add icons or text)
- `alt` text on all images
- Sufficient color contrast (AA minimum)

---

## Design Principles

### Consistency
- Use Tailwind's spacing scale consistently. Never mix `p-5` and `p-[20px]` — pick one.
- Always use design tokens from the theme (`text-foreground`, `bg-card`) instead of raw colors like `text-gray-900`.

### Visual Hierarchy
- One clear primary action per section. Use `variant="default"` for the primary CTA, `variant="outline"` or `variant="ghost"` for secondary.
- Headline → Subheadline → Body → Caption. Each level reduces font size and weight.
- Use whitespace aggressively. When in doubt, add more padding.

### Spacing Rhythm (4/8px grid)
- Use multiples of 4: `p-4`, `gap-8`, `mt-12`, `px-6`, etc.
- Section padding: `py-16` or `py-24` for major sections.
- Component internal padding: `p-4` to `p-6`.
- Inline gaps: `gap-2` to `gap-4`.

### Typography
- Max line length: ~65–75 characters (`max-w-prose`).
- Use `font-medium` or `font-semibold` for labels and headings. Reserve `font-bold` for hero text.
- Muted helper text: `text-muted-foreground text-sm`.

### Color Usage
- Primary actions: `bg-primary text-primary-foreground`
- Surfaces: `bg-card`, `bg-background`, `bg-muted`
- Borders: `border border-border`
- Destructive: `text-destructive` for errors only
- Avoid pure black/white — use theme foreground/background tokens

### Motion & Interaction
- Prefer `transition-colors duration-200` for hover states.
- Use `hover:bg-accent` for interactive rows/items.
- Shadcn components include animation by default — do not override unless necessary.
- Loading states: use `Skeleton` component from Shadcn, not spinners.

---

## Shadcn Component Cheatsheet

| Need | Shadcn Component |
|---|---|
| Button | `<Button variant="default \| outline \| ghost \| destructive">` |
| Text input | `<Input>` + `<Label>` |
| Dropdown | `<DropdownMenu>` |
| Modal | `<Dialog>` |
| Notification | `<Toast>` via `useToast()` |
| Tabs | `<Tabs>` |
| Card container | `<Card>` + `<CardHeader>` + `<CardContent>` |
| Badge/tag | `<Badge variant="default \| secondary \| outline">` |
| Loading state | `<Skeleton>` |
| Tooltip | `<Tooltip>` |
| Select | `<Select>` |
| Checkbox / Toggle | `<Checkbox>` / `<Switch>` |
| Separator | `<Separator>` |

---

## Code Patterns

### Page Section
```tsx
<section className="py-16 px-4 sm:px-6 lg:px-8">
  <div className="mx-auto max-w-5xl">
    {/* content */}
  </div>
</section>
```

### Hero
```tsx
<div className="flex flex-col items-center text-center gap-6 py-24">
  <Badge variant="secondary">Label</Badge>
  <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">Headline</h1>
  <p className="max-w-prose text-lg text-muted-foreground">Subheadline</p>
  <div className="flex gap-3">
    <Button size="lg">Primary CTA</Button>
    <Button size="lg" variant="outline">Secondary CTA</Button>
  </div>
</div>
```

### Feature Grid
```tsx
<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
  {features.map((f) => (
    <Card key={f.title}>
      <CardHeader>
        <f.icon className="h-6 w-6 text-primary mb-2" />
        <CardTitle className="text-base">{f.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{f.description}</p>
      </CardContent>
    </Card>
  ))}
</div>
```

### Form Layout
```tsx
<div className="space-y-4">
  <div className="space-y-1.5">
    <Label htmlFor="email">Email</Label>
    <Input id="email" type="email" placeholder="you@example.com" />
  </div>
  <Button type="submit" className="w-full">Submit</Button>
</div>
```

---

## Quality Checklist

Before delivering any UI:

- [ ] Mobile-first breakpoints applied
- [ ] Spacing follows 4/8px grid — no arbitrary values
- [ ] Color uses theme tokens, not hardcoded hex values
- [ ] Visual hierarchy is clear — one primary CTA per section
- [ ] All interactive elements have keyboard focus states
- [ ] Text has sufficient contrast against its background
- [ ] Line lengths use `max-w-prose` or explicit max-width
- [ ] Loading/empty/error states are handled (at minimum, noted)
- [ ] Shadcn components used where applicable (no reinventing the wheel)
- [ ] Dark mode works if project uses it (tokens handle this automatically)

---

## Common Mistakes to Avoid

- **Hardcoded colors:** `text-gray-600` instead of `text-muted-foreground`. Use tokens.
- **Arbitrary values:** `mt-[13px]` — snap to the scale instead (`mt-3` or `mt-4`).
- **Too many font weights:** Reserve `font-bold` for major headings only.
- **Missing hover states:** All clickable surfaces need a visible hover style.
- **Fixed widths on mobile:** Use `w-full` with `sm:w-auto` patterns instead.
- **Stacking too much in one card:** Break dense content into multiple sections or tabs.
- **Small tap targets:** Buttons should be at minimum `h-9` (Shadcn default) or larger on mobile.
