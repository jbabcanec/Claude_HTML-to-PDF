# Presentation Templates

Professional HTML presentation templates optimized for Claude AI and PDF conversion.

## Available Templates

### Horizontal Templates (16:9 - 1920x1080px)

| Template | Use Case | Best For |
|----------|----------|----------|
| **[Business Template](horizontal/business-template.html)** | Corporate presentations, quarterly reviews | Executives, stakeholders, board meetings |
| **[Tech Template](horizontal/tech-template.html)** | Technical documentation, architecture | Developers, engineers, technical teams |
| **[Marketing Template](horizontal/marketing-template.html)** | Product launches, campaigns | Marketing teams, product managers |

### Vertical Templates (9:16 - 1080x1920px)

| Template | Use Case | Best For |
|----------|----------|----------|
| **[Mobile App Template](vertical/mobile-app-template.html)** | App showcases, feature presentations | Mobile developers, product teams |
| **[Social Media Template](vertical/social-media-template.html)** | Social content, brand materials | Content creators, social media managers |

## Using Templates

### Method 1: Direct Prompting
```
Create a presentation about [TOPIC] using the structure from templates/horizontal/business-template.html. Replace all placeholder text with:
- Title: [YOUR_TITLE]
- Content: [YOUR_CONTENT]
- Metrics: [YOUR_DATA]
```

### Method 2: Template Customization
1. Download the template HTML file
2. Replace placeholder text in brackets `[...]`
3. Customize colors and branding
4. Test in browser
5. Convert to PDF

### Method 3: Reference Structure
```
Create a presentation similar to templates/tech-template.html but about [YOUR_TOPIC]. Follow the same layout structure with:
- Dark theme for technical content
- Code syntax highlighting
- Architecture diagrams
- Performance metrics
```

## Template Features

### Common Elements
- ✅ Responsive navigation dots
- ✅ Keyboard arrow key support
- ✅ Smooth transitions between slides
- ✅ PDF-optimized styling
- ✅ Self-contained (no external dependencies)

### Design Principles
- **High Contrast**: Ensures readability in PDF format
- **Large Typography**: Minimum 24px for body text
- **System Fonts**: Reliable cross-platform rendering
- **Semantic Structure**: Proper HTML hierarchy
- **Accessibility**: Screen reader friendly

## Customization Guide

### Colors
Update CSS custom properties:
```css
:root {
    --primary-color: #your-brand-color;
    --secondary-color: #your-accent-color;
    --background: #your-bg-color;
}
```

### Fonts
Modify the font stack:
```css
body {
    font-family: 'Your-Font', -apple-system, BlinkMacSystemFont, sans-serif;
}
```

### Layout
Adjust dimensions for different formats:
```css
body {
    width: 1920px;  /* Horizontal: 1920px, Vertical: 1080px */
    height: 1080px; /* Horizontal: 1080px, Vertical: 1920px */
}
```

## Creating Custom Templates

### Basic Structure
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=1920, height=1080">
    <title>Presentation Title</title>
    <style>
        /* Embedded CSS */
    </style>
</head>
<body>
    <!-- Slides -->
    <div class="slide active">Slide 1</div>
    <div class="slide">Slide 2</div>
    
    <!-- Navigation -->
    <div class="nav-dots">
        <div class="dot active" onclick="showSlide(0)"></div>
        <div class="dot" onclick="showSlide(1)"></div>
    </div>
    
    <script>
        /* Navigation JavaScript */
    </script>
</body>
</html>
```

### Required Classes
- `.slide` - Individual slide container
- `.active` - Currently visible slide
- `.dot` - Navigation indicator
- `showSlide(index)` - Navigation function

## Best Practices

### For Claude Prompting
1. **Be Specific**: Reference exact template files
2. **Include Dimensions**: Always specify 1920x1080 or 1080x1920
3. **Embed Everything**: No external CSS/JS dependencies
4. **Test Structure**: Ensure navigation works

### For PDF Conversion
1. **High Contrast**: Dark text on light backgrounds (or vice versa)
2. **Large Text**: Minimum 24px for readability
3. **Simple Gradients**: Avoid complex visual effects
4. **Solid Backgrounds**: Better for printing

### For Maintenance
1. **Validate HTML**: Ensure proper structure
2. **Test Navigation**: Verify slide transitions
3. **Check Responsiveness**: Test on different screen sizes
4. **Optimize Performance**: Minimize CSS/JS complexity

## Template Requests

Need a custom template? [Open an issue](https://github.com/jbabcanec/Claude_HTML-to-PDF/issues) with:
- Use case description
- Target audience
- Design preferences
- Required features

## Contributing

To contribute a new template:
1. Follow the existing template structure
2. Include comprehensive documentation
3. Test with the PDF converter
4. Submit a pull request

---

**Note**: All templates are optimized for Claude AI generation and PDF conversion. They serve as both starting points and reference implementations for creating presentation-ready HTML files.