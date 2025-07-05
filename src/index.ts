import fs from "fs";
import path from "path";
import PresentationConverter, { ConversionOptions } from "./converter";

async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
      showHelp();
      process.exit(0);
    }

    // Get input and output paths
    const inputFile = args[0] || path.join('input', 'presentation.html');
    const outputFile = args[1] || path.join('output', `presentation-${Date.now()}.pdf`);
    
    // Parse options
    const options: ConversionOptions = {};
    
    if (args.includes('--format')) {
      const formatIndex = args.indexOf('--format');
      if (formatIndex !== -1 && args[formatIndex + 1]) {
        options.format = args[formatIndex + 1] as any;
      }
    }
    
    if (args.includes('--width')) {
      const widthIndex = args.indexOf('--width');
      if (widthIndex !== -1 && args[widthIndex + 1]) {
        options.width = parseInt(args[widthIndex + 1]);
      }
    }
    
    if (args.includes('--height')) {
      const heightIndex = args.indexOf('--height');
      if (heightIndex !== -1 && args[heightIndex + 1]) {
        options.height = parseInt(args[heightIndex + 1]);
      }
    }
    
    if (args.includes('--wait')) {
      const waitIndex = args.indexOf('--wait');
      if (waitIndex !== -1 && args[waitIndex + 1]) {
        options.waitTime = parseInt(args[waitIndex + 1]);
      }
    }

    // Check if input file exists
    if (!fs.existsSync(inputFile)) {
      console.error(`❌ Input file not found: ${inputFile}`);
      console.error("\nPlease place your HTML files in the 'input' folder or specify a path.");
      process.exit(1);
    }

    // Convert the presentation
    const converter = new PresentationConverter();
    const result = await converter.convert(inputFile, outputFile, options);
    
    if (!result.success) {
      console.error(`\n❌ Conversion failed: ${result.error}`);
      process.exit(1);
    }
    
    console.log("\n✨ Conversion completed successfully!");
    
  } catch (error) {
    console.error("❌ Unexpected error:", error);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
HTML to PDF Converter for Claude Presentations

Usage:
  npm run start [input.html] [output.pdf] [options]

Arguments:
  input.html    Path to input HTML file (default: input/presentation.html)
  output.pdf    Path to output PDF file (default: output/presentation-{timestamp}.pdf)

Options:
  --format      Presentation format: auto, horizontal, vertical (default: auto)
  --width       PDF width in pixels (default: 1920 for horizontal, 1080 for vertical)
  --height      PDF height in pixels (default: 1080 for horizontal, 1920 for vertical)
  --wait        Wait time between slides in ms (default: 1500)
  --help, -h    Show this help message

Examples:
  npm run start
  npm run start input/my-presentation.html
  npm run start input/slides.html output/slides.pdf
  npm run start presentation.html output.pdf --format vertical
  npm run start slides.html report.pdf --wait 2000
`);
}

// Run the main function
main();