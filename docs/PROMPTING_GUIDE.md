# Claude HTML Presentation Prompting Guide

This guide contains proven prompts and strategies for getting Claude to create high-quality HTML presentations that work perfectly with this converter.

## Quick Start Templates

### Business Presentation Prompt
```
Create a professional business presentation about [TOPIC] as a single HTML file. Use the template structure from templates/horizontal/business-template.html as a base. Include:

- Title slide with compelling headline
- 3-4 content slides with key points
- Metrics/data slide with numbers
- Call-to-action or summary slide

Requirements:
- 16:9 aspect ratio (1920x1080px)
- Gradient backgrounds
- Large, readable fonts (minimum 36px)
- Navigation dots
- Professional color scheme
- All CSS embedded in <style> tags
- JavaScript for slide navigation
```

### Technical Presentation Prompt
```
Create a technical presentation about [TECHNOLOGY/TOPIC] as a single HTML file. Follow the template pattern from templates/horizontal/tech-template.html. Include:

- Technical title slide
- Architecture/system overview
- Code examples with syntax highlighting
- Implementation details
- Performance metrics or results

Requirements:
- Dark theme with code-friendly colors
- Monospace fonts for code
- Syntax highlighting (use CSS classes)
- 1920x1080px dimensions
- Technical color palette (dark blues, greens)
- Professional layout suitable for developer audience
```

### Mobile App Presentation Prompt
```
Create a mobile app presentation about [APP_NAME] as a single HTML file. Use vertical 9:16 format (1080x1920px) following templates/vertical/mobile-app-template.html structure. Include:

- App launch slide with name and tagline
- Key features showcase
- User metrics/statistics
- Download call-to-action

Requirements:
- Vertical orientation (1080x1920px)
- Mobile-friendly design language
- Bright, engaging colors
- Large touch-friendly elements
- App store button styling
```

## Advanced Prompting Strategies

### 1. Specific Dimension Requirements
Always include exact dimensions in your prompt:
```
Create a presentation with exact dimensions of 1920x1080px for horizontal format
OR
Create a presentation with exact dimensions of 1080x1920px for vertical format
```

### 2. Navigation Requirements
Specify navigation method:
```
Include navigation using:
- Clickable dots at the bottom
- Keyboard arrow key support
- showSlide(index) JavaScript function
- .slide and .active classes for slide management
```

### 3. Self-Contained Requirement
```
Make this a completely self-contained HTML file with:
- All CSS embedded in <style> tags (no external stylesheets)
- All JavaScript embedded in <script> tags
- No external dependencies or CDN links
- All fonts using system font stacks
```

### 4. PDF-Optimized Styling
```
Optimize for PDF conversion by:
- Using print-friendly fonts (system fonts preferred)
- Avoiding complex animations or transitions
- Using solid backgrounds or simple gradients
- Ensuring high contrast for readability
- Making text large enough for PDF viewing (minimum 24px)
```

## Content-Specific Prompts

### Quarterly Business Review
```
Create a Q4 business review presentation with:
- Executive summary slide
- Revenue metrics with actual numbers
- Growth charts or visual representations
- Key achievements and milestones
- Future outlook/goals for next quarter
- Professional gradient backgrounds
- Corporate color scheme (blues, grays)
```

### Product Launch
```
Create a product launch presentation featuring:
- Hero slide with product name and compelling value proposition
- Problem/solution narrative
- Key features and benefits (3-5 main features)
- Market opportunity or target audience
- Pricing or availability information
- Strong call-to-action
- Modern, engaging visual design
```

### Technical Architecture
```
Create a technical architecture presentation covering:
- System overview with component diagram
- Technology stack details
- Data flow illustrations
- API endpoints or integration points
- Security considerations
- Performance metrics
- Deployment architecture
- Dark theme suitable for technical audience
```

### Marketing Campaign
```
Create a marketing campaign presentation including:
- Campaign concept and creative direction
- Target audience demographics
- Channel strategy (social, digital, traditional)
- Budget allocation and ROI projections
- Timeline and key milestones
- Success metrics and KPIs
- Creative mockups or examples
- Vibrant, brand-appropriate colors
```

### Educational Content
```
Create an educational presentation about [TOPIC] with:
- Learning objectives clearly stated
- Information broken into digestible chunks
- Visual examples and illustrations
- Key takeaways or summary points
- Interactive elements (quizzes, questions)
- References or additional resources
- Clean, academic-appropriate design
```

## Styling Best Practices

### Color Schemes
Include specific color guidance:
```
Use a professional color palette such as:
- Primary: #667eea (soft blue)
- Secondary: #764ba2 (purple)
- Accent: #48bb78 (green)
- Text: #2d3748 (dark gray)
- Background: #f7fafc (light gray)
```

### Typography Guidelines
```
Use typography hierarchy:
- H1 titles: 72-108px, bold weight
- H2 section headers: 48-72px, semibold
- Body text: 24-36px, regular weight
- Captions/notes: 18-24px, light weight
- Use system font stacks for reliability
```

### Layout Patterns
```
Follow these layout principles:
- Generous padding (80-100px on all sides)
- Consistent spacing between elements
- Clear visual hierarchy
- Adequate white space
- Center-aligned content for presentations
- High contrast for readability
```

## Troubleshooting Common Issues

### Slides Not Detected
If the converter can't find slides, ensure your HTML includes:
```html
<div class="slide active">...</div>
<div class="slide">...</div>
<!-- Navigation dots -->
<div class="dot active" onclick="showSlide(0)"></div>
```

### Navigation Not Working
Include proper JavaScript:
```javascript
function showSlide(index) {
    document.querySelectorAll('.slide').forEach(slide => 
        slide.classList.remove('active'));
    document.querySelectorAll('.dot').forEach(dot => 
        dot.classList.remove('active'));
    
    document.querySelectorAll('.slide')[index].classList.add('active');
    document.querySelectorAll('.dot')[index].classList.add('active');
}
```

### Poor PDF Quality
Optimize for PDF output:
- Use high contrast colors
- Avoid very thin fonts or lines
- Ensure minimum 24px font size
- Use solid or simple gradient backgrounds
- Test with print CSS media queries

## Template Customization

### Using Templates as Base
```
Take the [TEMPLATE_NAME] template from the templates/ folder and customize it by:
- Replacing placeholder text with actual content
- Updating colors to match brand guidelines
- Modifying layout to fit content needs
- Adding or removing slides as needed
- Updating navigation to match slide count
```

### Brand Integration
```
Integrate brand elements by:
- Using brand colors in gradients and backgrounds
- Incorporating logo or brand imagery
- Following brand typography guidelines
- Matching brand voice and tone
- Including brand contact information
```

## Testing Your Presentations

Before converting to PDF, test your presentation by:
1. Opening the HTML file in a browser
2. Testing navigation (arrow keys and dots)
3. Checking responsive behavior
4. Verifying all content is visible
5. Ensuring proper slide transitions
6. Testing on different screen sizes

## Example Complete Prompt

```
Create a comprehensive business presentation about our Q4 2024 performance as a single, self-contained HTML file. 

Content Requirements:
- Title slide: "Q4 2024 Business Review - Exceeding Expectations"
- Agenda slide with 5 key topics
- Revenue slide showing $2.3M quarterly revenue (up 34% YoY)
- Customer growth: 1,250 new customers, 23% retention rate improvement
- Product achievements: 3 major feature launches, 99.9% uptime
- Team accomplishments: 5 new hires, 2 promotions, team satisfaction 8.7/10
- 2025 outlook: expansion goals, new market entry, Series B funding
- Thank you/Q&A slide

Technical Requirements:
- Exactly 1920x1080px dimensions for horizontal viewing
- Professional color scheme with blue/purple gradients
- Large, readable fonts (minimum 36px for body text)
- Navigation dots and keyboard arrow support
- All CSS and JavaScript embedded (no external files)
- Use showSlide() function and .slide/.active classes
- Optimize for PDF conversion with high contrast

Design Style:
- Clean, corporate aesthetic
- Gradient backgrounds
- Proper spacing and typography hierarchy
- Professional but engaging visual design
- White text on colored backgrounds for key slides

Make this presentation board-ready and suitable for executive presentation.
```

This prompt provides clear guidance for content, technical specs, and design requirements while being specific enough for consistent results.