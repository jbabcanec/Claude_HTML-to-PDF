# Claude HTML to PDF Converter

A powerful tool to convert Claude AI-generated HTML presentations into professional PDF documents with perfect formatting preservation.

## Features

- **Perfect Formatting**: Preserves all CSS styles, gradients, and animations in the final PDF
- **Auto-Detection**: Automatically detects slide structure and navigation methods
- **Multiple Formats**: Supports both horizontal (16:9) and vertical (9:16) presentation layouts
- **Fast Processing**: Efficient conversion with progress tracking and optimization
- **Robust Edge Case Handling**: Works with various presentation frameworks and structures
- **Web Interface**: Beautiful GitHub Pages hosted interface for easy conversion
- **CLI Tool**: Command-line interface for automated workflows

## Quick Start

### Using the Web Interface

Visit [https://jbabcanec.github.io/Claude_HTML-to-PDF/](https://jbabcanec.github.io/Claude_HTML-to-PDF/) to use the web-based converter.

### Using the CLI

1. **Clone the repository**:
```bash
git clone https://github.com/jbabcanec/Claude_HTML-to-PDF.git
cd Claude_HTML-to-PDF
```

2. **Install dependencies**:
```bash
npm install
```

3. **Build the project**:
```bash
npm run build
```

4. **Convert a presentation**:
```bash
npm run start input/presentation.html output/presentation.pdf
```

## Usage

### Basic Usage

```bash
npm run start [input.html] [output.pdf] [options]
```

### Arguments

- `input.html` - Path to input HTML file (default: `input/presentation.html`)
- `output.pdf` - Path to output PDF file (default: `output/presentation-{timestamp}.pdf`)

### Options

- `--format` - Presentation format: `auto`, `horizontal`, `vertical` (default: `auto`)
- `--width` - PDF width in pixels (default: 1920 for horizontal, 1080 for vertical)
- `--height` - PDF height in pixels (default: 1080 for horizontal, 1920 for vertical)
- `--wait` - Wait time between slides in ms (default: 1500)
- `--help, -h` - Show help message

### Examples

```bash
# Convert with default settings
npm run start

# Convert specific file
npm run start presentation.html

# Convert with custom output
npm run start input/slides.html output/slides.pdf

# Convert vertical presentation
npm run start presentation.html output.pdf --format vertical

# Adjust wait time for animations
npm run start slides.html report.pdf --wait 2000
```

## Project Structure

```
Claude_HTML-to-PDF/
├── src/                    # Source code
│   ├── index.ts           # Main CLI entry point
│   └── converter.ts       # Core conversion logic
├── input/                 # Input HTML files directory
├── output/                # Generated PDF files directory
├── examples/              # Example presentations
├── web/                   # Web interface assets
│   └── assets/
│       ├── css/          # Stylesheets
│       ├── js/           # JavaScript files
│       └── img/          # Images
├── docs/                  # Documentation
├── index.html            # GitHub Pages interface
├── package.json          # Node.js configuration
├── tsconfig.json         # TypeScript configuration
└── README.md             # This file
```

## How It Works

1. **HTML Loading**: The converter loads your HTML presentation using Puppeteer
2. **Format Detection**: Automatically detects presentation dimensions and orientation
3. **Slide Detection**: Identifies slides using various methods:
   - CSS selectors (`.slide`, `[data-slide]`, `section`)
   - Navigation indicators (dots, pagination)
   - Slide counters
   - JavaScript navigation functions
4. **PDF Generation**: Captures each slide as a high-quality PDF page
5. **PDF Merging**: Combines all slides into a single PDF document

## Supported Presentation Types

- Claude's standard HTML presentations
- Reveal.js presentations
- Swiper.js slideshows
- Custom HTML/CSS presentations with standard slide structures
- Single-page presentations

## Development

### Prerequisites

- Node.js 16 or higher
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build TypeScript
npm run build

# Run tests
npm test
```

### Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Troubleshooting

### Common Issues

**Problem**: PDF generation fails with timeout error
**Solution**: Increase the wait time using `--wait 3000` option

**Problem**: Slides are not detected correctly
**Solution**: Ensure your HTML uses standard slide selectors or specify custom selectors

**Problem**: Formatting is not preserved
**Solution**: Make sure all CSS is embedded or linked with absolute paths

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built for converting Claude AI-generated presentations
- Uses Puppeteer for browser automation
- Uses pdf-lib for PDF manipulation
- Inspired by the need for better AI-to-PDF conversion tools

## Support

For issues, feature requests, or questions:
- Open an issue on [GitHub](https://github.com/jbabcanec/Claude_HTML-to-PDF/issues)
- Contact the maintainer: [@jbabcanec](https://github.com/jbabcanec)