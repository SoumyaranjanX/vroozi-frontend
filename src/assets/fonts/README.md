# Typography System Documentation

## Overview
This document provides comprehensive guidance for implementing and maintaining the application's typography system. The system is designed to ensure consistency, accessibility, and optimal performance across all components.

## Font Specifications

### Primary Font Family
- **Font**: Arial
- **Base Size**: 16px
- **Usage**: Primary text, UI elements, form fields
- **Implementation**:
```scss
$font-family-primary: Arial, sans-serif;
$font-size-base: 16px;
```

### Secondary Font Family
- **Font**: Helvetica
- **Usage**: Alternative font, system fallback
- **Implementation**:
```scss
$font-family-secondary: Helvetica, Arial, sans-serif;
```

### Type Scale
| Element | Size | Weight | Line Height |
|---------|------|---------|-------------|
| H1 | 24px | Bold (700) | 1.2 |
| H2 | 20px | Semi-bold (600) | 1.25 |
| H3 | 18px | Semi-bold (600) | 1.3 |
| H4 | 16px | Semi-bold (600) | 1.35 |
| Body | 16px | Regular (400) | 1.5 |
| Small | 14px | Regular (400) | 1.4 |
| Labels | 14px | Medium (500) | 1.4 |
| Captions | 12px | Regular (400) | 1.3 |

## Implementation Guide

### SCSS Variables
Core typography variables are defined in `_variables.scss`:
```scss
$font-weights: (
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700
);
```

### Mixins
Available in `_typography.scss`:
```scss
@mixin heading-styles($size, $weight) {
  font-size: $size;
  font-weight: map-get($font-weights, $weight);
  margin-bottom: 0.5em;
}

@mixin body-text {
  font-size: $font-size-base;
  line-height: 1.5;
  font-weight: map-get($font-weights, regular);
}
```

## Responsive Typography

### Breakpoint Scale
| Breakpoint | Base Font Size | Scale Factor |
|------------|----------------|--------------|
| Mobile (<768px) | 14px | 1 |
| Tablet (768px-1023px) | 15px | 1.1 |
| Desktop (1024px-1439px) | 16px | 1.2 |
| Large (≥1440px) | 16px | 1.25 |

### Implementation
```scss
@mixin responsive-typography {
  @media (max-width: 767px) {
    font-size: 14px;
  }
  
  @media (min-width: 768px) and (max-width: 1023px) {
    font-size: 15px;
  }
  
  @media (min-width: 1024px) {
    font-size: 16px;
  }
}
```

## Accessibility Compliance

### Requirements
- Minimum contrast ratio: 4.5:1 for normal text
- Minimum contrast ratio: 3:1 for large text (18px+ or 14px+ bold)
- Text must be resizable up to 200% without loss of functionality
- No text images (except logos) - all text must be HTML text

### Implementation
```scss
// Example of accessible text styles
.text-styles {
  color: #2e2e2e; // Ensures 4.5:1 contrast ratio on white
  font-size: 16px;
  line-height: 1.5;
  font-weight: 400;
}
```

## Performance Optimization

### Font Loading Strategy
1. Use system fonts for initial render
2. Load web fonts asynchronously
3. Implement font-display: swap
4. Utilize font subsetting for minimal file size

### Example Implementation
```html
<link rel="preload" href="/assets/fonts/arial.woff2" as="font" type="font/woff2" crossorigin>
```

## Browser Compatibility

### Minimum Support
- Chrome 90+
- Firefox 85+
- Safari 14+
- Edge 90+
- iOS Safari 14+
- Android Chrome 90+

### Fallback Strategy
```css
font-family: Arial, Helvetica, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
```

## Component Guidelines

### Buttons
- Font: Arial
- Size: 16px
- Weight: Semi-bold (600)
- Text transform: None
- Letter spacing: 0.2px

### Form Fields
- Font: Arial
- Size: 16px
- Weight: Regular (400)
- Line height: 1.5

### Navigation
- Font: Arial
- Size: 14px
- Weight: Medium (500)
- Text transform: None

## Internationalization

### Character Set Support
- UTF-8 encoding
- Support for extended Latin characters
- Right-to-left (RTL) text support
- CJK character support

### Language-Specific Adjustments
```scss
[lang="ja"] {
  font-family: "Hiragino Sans", Arial, sans-serif;
  line-height: 1.7;
}
```

## Troubleshooting

### Common Issues
1. **Font Loading FOUT/FOIT**
   - Solution: Implement font-display: swap
   - Use appropriate preload strategies

2. **Inconsistent Sizing**
   - Solution: Use relative units (rem/em)
   - Implement proper CSS reset

3. **Poor Performance**
   - Solution: Optimize font files
   - Implement proper caching strategies

4. **Accessibility Violations**
   - Solution: Regular contrast ratio checks
   - Implement proper heading hierarchy

## Additional Resources

- [WCAG 2.1 Typography Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [Google Fonts Best Practices](https://developers.google.com/fonts/docs/technical_considerations)
- [MDN Web Fonts Guide](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2023-01-01 | Initial release |
| 1.1.0 | 2023-06-01 | Added responsive typography |
| 1.2.0 | 2023-12-01 | Enhanced accessibility guidelines |