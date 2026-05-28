# MCP Hub Design System

## 1. Color Palette

### Brand Colors
```
Primary: #0A7EA4 (Teal Blue)
  - Light: #4DA6C7
  - Dark: #055A7A

Secondary: #FF6B6B (Coral Red)
  - Light: #FF9999
  - Dark: #E63946
```

### Semantic Colors
```
Success: #22C55E (Green)
  - Light: #86EFAC
  - Dark: #16A34A

Warning: #F59E0B (Amber)
  - Light: #FCD34D
  - Dark: #D97706

Error: #EF4444 (Red)
  - Light: #FCA5A5
  - Dark: #DC2626

Info: #3B82F6 (Blue)
  - Light: #93C5FD
  - Dark: #1D4ED8
```

### Neutral Colors
```
Background: #FFFFFF (Light) / #0F172A (Dark)
Surface: #F8FAFC (Light) / #1E293B (Dark)
Border: #E2E8F0 (Light) / #334155 (Dark)
Text (Foreground): #0F172A (Light) / #F1F5F9 (Dark)
Text (Muted): #64748B (Light) / #94A3B8 (Dark)
```

### Usage Guidelines
- **Primary**: Main CTAs, active states, brand moments
- **Secondary**: Destructive actions, alerts
- **Success**: Positive feedback, confirmations
- **Warning**: Cautions, pending states
- **Error**: Errors, failures, blocked states
- **Info**: Informational messages, hints
- **Neutral**: Backgrounds, borders, secondary text

---

## 2. Typography

### Type Scale
```
H1: 32px, Weight 700, Line Height 1.2
H2: 28px, Weight 700, Line Height 1.2
H3: 24px, Weight 600, Line Height 1.3
H4: 20px, Weight 600, Line Height 1.3
H5: 18px, Weight 600, Line Height 1.4
H6: 16px, Weight 600, Line Height 1.4

Body Large: 16px, Weight 400, Line Height 1.5
Body: 14px, Weight 400, Line Height 1.5
Body Small: 12px, Weight 400, Line Height 1.5

Caption: 12px, Weight 500, Line Height 1.4
Overline: 11px, Weight 600, Line Height 1.4, Letter Spacing +0.5px
```

### Font Families
```
Primary: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
Monospace: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace
```

### Font Weight Usage
- **700 (Bold)**: Headings, strong emphasis
- **600 (Semibold)**: Subheadings, labels, strong body text
- **500 (Medium)**: Buttons, badges, captions
- **400 (Regular)**: Body text, descriptions

### Text Color Hierarchy
1. **Primary Text**: Foreground color (high contrast)
2. **Secondary Text**: Muted color (medium contrast)
3. **Tertiary Text**: Muted color at 60% opacity (low contrast)

---

## 3. Spacing & Layout

### Spacing Scale (8pt Grid)
```
xs: 4px
sm: 8px
md: 12px
lg: 16px
xl: 24px
2xl: 32px
3xl: 48px
4xl: 64px
```

### Safe Area Padding
```
Mobile Portrait: 16px horizontal, 12px top, 8px bottom
Tab Bar: Always reserve 56px + safe area bottom
Notch/Dynamic Island: Handled by SafeAreaView
```

### Component Spacing
```
Card Padding: 16px
Button Padding: 12px horizontal, 10px vertical
Input Padding: 12px
List Item Padding: 12px vertical, 16px horizontal
Modal Padding: 20px
```

### Layout Grid
```
Columns: 4-column grid for mobile
Gutter: 8px between columns
Max Width: Full screen width
Breakpoints:
  - Mobile: 0-599px (1 column)
  - Tablet: 600-1199px (2 columns)
  - Desktop: 1200px+ (4 columns)
```

---

## 4. Component Library

### Button Component
```
Variants:
  - Primary: Solid primary color, white text
  - Secondary: Solid surface color, primary text, border
  - Tertiary: Transparent, primary text
  - Destructive: Solid error color, white text
  - Ghost: Transparent, no border

Sizes:
  - Large: 48px height, 16px padding horizontal
  - Medium: 40px height, 14px padding horizontal (default)
  - Small: 32px height, 12px padding horizontal

States:
  - Default: Normal state
  - Pressed: Scale 0.97, opacity 0.9
  - Disabled: Opacity 0.5, no interaction
  - Loading: Spinner overlay
```

### Card Component
```
Variants:
  - Elevated: Shadow + border
  - Outlined: Border only
  - Filled: Solid background

Padding: 16px
Border Radius: 12px
Border: 1px solid border color
Shadow: 0 1px 3px rgba(0,0,0,0.1)

States:
  - Default: Normal
  - Hover/Pressed: Opacity 0.8, slight scale
  - Interactive: Pointer cursor
```

### Input Component
```
Variants:
  - Text: Standard text input
  - Select: Dropdown select
  - Checkbox: Boolean toggle
  - Radio: Single selection
  - Toggle: On/off switch

Height: 40px
Padding: 12px horizontal, 8px vertical
Border Radius: 8px
Border: 1px solid border color

States:
  - Default: Border color
  - Focused: Primary color border, 2px width
  - Filled: Slightly darker background
  - Error: Error color border + error text below
  - Disabled: Opacity 0.5, no interaction
```

### List Component
```
Item Height: 56px (with icon + text)
Item Padding: 12px vertical, 16px horizontal
Divider: 1px border-bottom, 16px left inset
Icon Size: 24px, left aligned
Text: Body font, 14px
Secondary Text: Muted, 12px

States:
  - Default: Normal
  - Pressed: Background opacity 0.1
  - Selected: Primary background, white text
```

### Badge Component
```
Variants:
  - Status: Colored background, white text
  - Category: Outlined, colored text
  - Count: Solid primary, white text, circular

Padding: 4px horizontal, 2px vertical (small)
Border Radius: 4px
Font: Overline (11px, 600 weight)
```

### Modal Component
```
Overlay: Transparent black 50% opacity
Content: White/dark background, rounded corners
Padding: 20px
Border Radius: 16px
Max Width: 90% of screen width

Buttons:
  - Primary action: Primary button
  - Secondary action: Secondary button
  - Dismiss: Close icon top-right

Animation: Slide up from bottom
```

---

## 5. Interaction & Animation

### Press Feedback
```
Primary Buttons:
  - Scale: 0.97
  - Duration: 80ms
  - Timing: EaseInOut

Secondary Elements:
  - Opacity: 0.7
  - Duration: 100ms
  - Timing: EaseInOut

Cards/Lists:
  - Opacity: 0.8
  - Duration: 100ms
  - Timing: EaseInOut
```

### Loading States
```
Spinner: Rotating primary color icon
Duration: 1 second per rotation
Size: 24px (small), 32px (medium), 40px (large)

Skeleton: Pulsing gray background
Duration: 1.5 second pulse
```

### Transitions
```
Page Navigation: Slide right (back), slide left (forward)
Duration: 300ms
Timing: EaseInOut

Modal Appearance: Slide up from bottom
Duration: 250ms
Timing: EaseOut

Dropdown Open: Fade in + slight scale
Duration: 150ms
Timing: EaseOut
```

### Haptic Feedback
```
Light Tap: ImpactFeedbackStyle.Light
  - Button press
  - List item selection

Medium Tap: ImpactFeedbackStyle.Medium
  - Toggle switch
  - Confirmation action

Success: NotificationFeedbackType.Success
  - Form submission
  - Action completion

Error: NotificationFeedbackType.Error
  - Validation failure
  - Action failure
```

---

## 6. Accessibility

### Touch Targets
```
Minimum: 44pt × 44pt (WCAG AAA)
Recommended: 48pt × 48pt
Spacing: 8pt minimum between targets
```

### Color Contrast
```
Normal Text: 4.5:1 (WCAG AA)
Large Text: 3:1 (WCAG AA)
UI Components: 3:1 (WCAG AA)
```

### Focus States
```
Keyboard Focus: 2px primary color outline
Focus Ring: 4px offset from element
Visible: Always visible, high contrast
```

### Icons
```
Size: Minimum 24px × 24px
Label: Always paired with text or aria-label
Color: Inherit from text color or semantic color
```

---

## 7. Dark Mode

### Implementation
```
CSS Variables: Use CSS custom properties
Automatic: Respect system preference
Toggle: Manual override in settings

Color Mapping:
  - Background: Light #FFFFFF → Dark #0F172A
  - Surface: Light #F8FAFC → Dark #1E293B
  - Text: Light #0F172A → Dark #F1F5F9
  - Border: Light #E2E8F0 → Dark #334155
```

### Testing
- Test all screens in both light and dark modes
- Verify contrast ratios in both modes
- Check for color-dependent information

---

## 8. Responsive Design

### Mobile First
```
Design for mobile 375px width first
Then adapt for tablet and desktop
Use CSS media queries for breakpoints
```

### Breakpoints
```
Mobile: 0-599px (1 column)
Tablet: 600-1199px (2 columns)
Desktop: 1200px+ (4 columns)
```

### Orientation
```
Portrait: 9:16 aspect ratio (primary)
Landscape: 16:9 aspect ratio (secondary)
Handle notch/safe area in both
```

---

## 9. Component Usage Examples

### Button
```tsx
<Pressable className="bg-primary rounded-lg p-3">
  <Text className="text-center font-semibold text-background">
    Primary Action
  </Text>
</Pressable>
```

### Card
```tsx
<View className="bg-surface rounded-lg p-4 border border-border">
  <Text className="text-lg font-semibold text-foreground">Title</Text>
  <Text className="text-sm text-muted mt-2">Description</Text>
</View>
```

### Input
```tsx
<TextInput
  placeholder="Enter text"
  className="bg-background border border-border rounded-lg p-3 text-foreground"
  placeholderTextColor={colors.muted}
/>
```

### List Item
```tsx
<Pressable className="flex-row items-center p-3 border-b border-border">
  <Text className="flex-1 text-foreground font-semibold">Item</Text>
  <Text className="text-muted text-sm">Value</Text>
</Pressable>
```

---

## 10. Implementation Checklist

- [ ] Update theme.config.js with new color palette
- [ ] Create reusable button component
- [ ] Create reusable card component
- [ ] Create reusable input component
- [ ] Create reusable list component
- [ ] Update all screens to use new components
- [ ] Test dark mode on all screens
- [ ] Verify touch targets on all interactive elements
- [ ] Test color contrast ratios
- [ ] Add loading states to all data-fetching screens
- [ ] Add empty states to all list screens
- [ ] Test on real devices (iOS + Android)
- [ ] Conduct accessibility audit
- [ ] Get user feedback on redesigns
