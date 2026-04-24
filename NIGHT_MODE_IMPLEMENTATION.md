# Night Mode Toggle Implementation

## Summary
Added a night mode toggle to the LogBlock sidebar with a "calm, relaxed, dark-blueish, night" color palette. The theme is switchable and persists in localStorage.

## Files Changed

### Created
1. **`src/hooks/useTheme.ts`** - Custom React hook for theme management
   - Reads/writes theme preference to localStorage (`logblock-theme` key)
   - Toggles `data-theme="dark"` attribute on document root
   - Adds/removes `dark` class for Tailwind compatibility

2. **`src/components/ui/ThemeToggle.tsx`** - Toggle button component
   - Sun icon (light mode) / Moon icon (dark mode)
   - Accessible with aria-label
   - Used in both desktop sidebar and mobile drawer

### Modified
1. **`src/index.css`** - Added dark theme CSS custom properties
   - `:root[data-theme="dark"]` block with navy/slate palette
   - Colors: deep navy (#0f172a), slate (#1e293b), muted blue-gray (#94a3b8)
   - CSS variables override light theme values

2. **`src/components/sidebar/Sidebar.tsx`** - Added theme toggle
   - Import ThemeToggle component
   - Toggle button at bottom of expanded sidebar (hidden when collapsed)

3. **`src/pages/WorkspacePage.tsx`** - Added toggle to mobile drawer
   - Import ThemeToggle component
   - Toggle button at bottom of mobile drawer menu

4. **`src/components/editor/editor-theme.css`** - Dark mode editor styles
   - BlockNote editor components styled for dark mode
   - All editor elements (toolbar, menus, code blocks, tables, etc.)
   - Calm blue accents (#3b82f6) instead of warm amber

5. **`tailwind.config.ts`** - Cleaned up config
   - Removed inline button class definition
   - Kept `darkMode: "class"` for Tailwind dark mode support

## Color Palette

### Night Mode (Dark Theme)
| Token | Value | Description |
|-------|-------|-------------|
| Background | `#0f172a` | Deep navy - main page BG |
| Surface | `#1e293b` | Slate - sidebar/containers |
| Surface 2 | `#334155` | Lighter slate - hover states |
| Text | `#f1f5f9` | Off-white - primary text |
| Text Muted | `#94a3b8` | Muted blue-gray - secondary text |
| Accent | `#3b82f6` | Calm blue - primary accent |
| Accent Dark | `#2563eb` | Darker blue - hover states |
| Border | `rgba(148, 163, 184, 0.2)` | Subtle slate border |

### Light Mode (Original)
| Token | Value | Description |
|-------|-------|-------------|
| Background | `#f5f0e6` | Aged paper cream |
| Surface | `#ebe5d5` | Warm parchment |
| Text | `#4a3f35` | Dark brown ink |
| Accent | `#c49a6c` | Warm amber |

## Features
- **Toggle Location**: Bottom of sidebar (desktop) and mobile drawer
- **Persistence**: Theme saved to localStorage
- **Default**: Light mode (falls back gracefully if no preference)
- **Icons**: Moon (switch to night) / Sun (switch to light)
- **Mobile Support**: Toggle accessible in mobile drawer view

## Testing Checklist
- [ ] Toggle visible in expanded sidebar
- [ ] Toggle hidden when sidebar collapsed
- [ ] Toggle visible in mobile drawer
- [ ] Click toggle switches theme
- [ ] Theme persists after page refresh
- [ ] Dark theme colors applied (navy/slate palette)
- [ ] Editor background/text colors update
- [ ] Buttons, inputs, modals styled correctly
- [ ] No flicker on page load

## Build Status
Build completed successfully with no errors.
