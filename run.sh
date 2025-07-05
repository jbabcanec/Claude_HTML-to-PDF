#!/bin/bash

echo "🚀 Claude's HTML-to-PDF Converter"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this script from the pdf_converter directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Failed to build TypeScript"
    exit 1
fi

# Get the HTML file path
HTML_PATH="$1"
if [ -z "$HTML_PATH" ]; then
    echo "❌ Please provide an HTML file to convert"
    echo "Usage: ./run.sh <input.html> [output.pdf]"
    exit 1
fi

# Get output path
OUTPUT_PATH="$2"
if [ -z "$OUTPUT_PATH" ]; then
    # Default output name based on input file
    BASENAME=$(basename "$HTML_PATH" .html)
    OUTPUT_PATH="${BASENAME}.pdf"
fi

echo "📁 Input file: $HTML_PATH"
echo "📄 Output file: $OUTPUT_PATH"

# Check if input file exists
if [ ! -f "$HTML_PATH" ]; then
    echo "❌ HTML file not found: $HTML_PATH"
    echo "Usage: ./run.sh [html-file] [output-pdf]"
    exit 1
fi

# Generate PDF
echo "🎬 Generating PDF..."
npm run start -- "$HTML_PATH" "$OUTPUT_PATH"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Success! PDF generated: $OUTPUT_PATH"
    echo "🎯 Ready for presentation!"
else
    echo "❌ PDF generation failed"
    exit 1
fi