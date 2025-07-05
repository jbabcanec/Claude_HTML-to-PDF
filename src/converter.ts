import puppeteer, { Browser, Page } from "puppeteer";
import { PDFDocument } from "pdf-lib";
import fs from "fs";
import path from "path";

export interface ConversionOptions {
  format?: 'auto' | 'horizontal' | 'vertical';
  width?: number;
  height?: number;
  quality?: number;
  waitTime?: number;
  slideSelector?: string;
  navigationMethod?: 'auto' | 'dots' | 'function' | 'arrow-keys';
  margin?: number;
  scale?: number;
}

export interface ConversionResult {
  success: boolean;
  outputPath?: string;
  error?: string;
  slideCount?: number;
  fileSize?: number;
  duration?: number;
}

class PresentationConverter {
  private defaultOptions: ConversionOptions = {
    format: 'auto',
    width: 1920,
    height: 1080,
    quality: 100,
    waitTime: 1500,
    slideSelector: '.slide',
    navigationMethod: 'auto',
    margin: 0,
    scale: 1
  };

  async convert(
    inputPath: string,
    outputPath: string,
    options: ConversionOptions = {}
  ): Promise<ConversionResult> {
    const startTime = Date.now();
    const opts = { ...this.defaultOptions, ...options };
    
    let browser: Browser | null = null;
    
    try {
      // Validate input
      if (!fs.existsSync(inputPath)) {
        throw new Error(`Input file not found: ${inputPath}`);
      }

      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      console.log("🚀 Starting PDF generation...");
      console.log(`📁 Input: ${inputPath}`);
      console.log(`📄 Output: ${outputPath}`);

      browser = await this.launchBrowser();
      const page = await browser.newPage();

      // Load the presentation
      const fullPath = path.resolve(inputPath);
      await page.goto(`file://${fullPath}`, {
        waitUntil: "networkidle0",
        timeout: 60000
      });

      // Detect presentation format
      const dimensions = await this.detectPresentationFormat(page, opts);
      await page.setViewport({
        width: dimensions.width,
        height: dimensions.height
      });

      // Wait for initial load
      await page.waitForTimeout(opts.waitTime!);

      // Detect slides
      const slideInfo = await this.detectSlides(page, opts);
      console.log(`📊 Found ${slideInfo.count} slides (method: ${slideInfo.method})`);

      if (slideInfo.count === 0) {
        throw new Error("No slides detected in the presentation");
      }

      // Capture slides
      const slideBuffers = await this.captureSlides(
        page,
        slideInfo,
        dimensions,
        opts
      );

      // Merge PDFs
      const mergedPdf = await this.mergePdfs(slideBuffers);
      const pdfBytes = await mergedPdf.save();
      
      // Save the final PDF
      fs.writeFileSync(outputPath, pdfBytes);

      const duration = (Date.now() - startTime) / 1000;
      const fileSize = pdfBytes.length / 1024 / 1024;

      console.log(`✅ PDF successfully generated: ${outputPath}`);
      console.log(`📊 Total slides: ${slideInfo.count}`);
      console.log(`📄 File size: ${fileSize.toFixed(2)} MB`);
      console.log(`⏱️  Duration: ${duration.toFixed(2)}s`);

      return {
        success: true,
        outputPath,
        slideCount: slideInfo.count,
        fileSize,
        duration
      };

    } catch (error) {
      console.error("❌ Error generating PDF:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  private async launchBrowser(): Promise<Browser> {
    return puppeteer.launch({
      headless: "new",
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ]
    });
  }

  private async detectPresentationFormat(
    page: Page,
    options: ConversionOptions
  ): Promise<{ width: number; height: number }> {
    if (options.format !== 'auto') {
      return {
        width: options.width!,
        height: options.height!
      };
    }

    // Try to detect from CSS or meta tags
    const dimensions = await page.evaluate(() => {
      // Check for viewport meta tag
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        const content = viewport.getAttribute('content') || '';
        const widthMatch = content.match(/width=(\d+)/);
        const heightMatch = content.match(/height=(\d+)/);
        if (widthMatch && heightMatch) {
          return {
            width: parseInt(widthMatch[1]),
            height: parseInt(heightMatch[1])
          };
        }
      }

      // Check for slide dimensions in CSS
      const firstSlide = document.querySelector('.slide, [data-slide], section');
      if (firstSlide) {
        const computed = window.getComputedStyle(firstSlide);
        const width = parseInt(computed.width);
        const height = parseInt(computed.height);
        if (width && height) {
          return { width, height };
        }
      }

      // Check body dimensions
      const bodyStyle = window.getComputedStyle(document.body);
      const bodyWidth = parseInt(bodyStyle.width);
      const bodyHeight = parseInt(bodyStyle.height);
      
      // Detect orientation based on aspect ratio
      if (bodyWidth && bodyHeight) {
        const aspectRatio = bodyWidth / bodyHeight;
        if (aspectRatio > 1.3) {
          return { width: 1920, height: 1080 }; // Horizontal
        } else {
          return { width: 1080, height: 1920 }; // Vertical
        }
      }

      // Default to horizontal
      return { width: 1920, height: 1080 };
    });

    console.log(`📐 Detected format: ${dimensions.width}x${dimensions.height}`);
    return dimensions;
  }

  private async detectSlides(
    page: Page,
    options: ConversionOptions
  ): Promise<{ count: number; method: string }> {
    const slideInfo = await page.evaluate((selector) => {
      // Try multiple selectors
      const selectors = [
        selector,
        '.slide',
        '[data-slide]',
        'section',
        '.swiper-slide',
        '.reveal .slides section',
        '.step',
        '.page'
      ];

      for (const sel of selectors) {
        const elements = document.querySelectorAll(sel);
        if (elements.length > 0) {
          return {
            count: elements.length,
            method: `selector: ${sel}`
          };
        }
      }

      // Check for indicator dots
      const indicators = document.querySelectorAll('.indicator-dot, .dot, .pagination-bullet');
      if (indicators.length > 0) {
        return {
          count: indicators.length,
          method: 'indicators'
        };
      }

      // Check for slide counter
      const counter = document.querySelector('.slide-counter, .slide-number');
      if (counter) {
        const text = counter.textContent || '';
        const match = text.match(/\d+\s*\/\s*(\d+)/);
        if (match) {
          return {
            count: parseInt(match[1]),
            method: 'counter'
          };
        }
      }

      // Single page presentation
      return {
        count: 1,
        method: 'single-page'
      };
    }, options.slideSelector!);

    return slideInfo;
  }

  private async captureSlides(
    page: Page,
    slideInfo: { count: number; method: string },
    dimensions: { width: number; height: number },
    options: ConversionOptions
  ): Promise<Buffer[]> {
    const buffers: Buffer[] = [];

    for (let i = 0; i < slideInfo.count; i++) {
      console.log(`📸 Capturing slide ${i + 1}/${slideInfo.count}...`);

      // Navigate to slide
      if (slideInfo.count > 1) {
        await this.navigateToSlide(page, i, options);
        await page.waitForTimeout(options.waitTime!);
      }

      // Capture PDF
      const pdfBuffer = await page.pdf({
        printBackground: true,
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
        pageRanges: "1",
        preferCSSPageSize: false,
        displayHeaderFooter: false,
        margin: {
          top: options.margin!,
          right: options.margin!,
          bottom: options.margin!,
          left: options.margin!
        },
        scale: options.scale!
      });

      buffers.push(pdfBuffer);
      console.log(`✅ Slide ${i + 1} captured`);
    }

    return buffers;
  }

  private async navigateToSlide(
    page: Page,
    index: number,
    options: ConversionOptions
  ): Promise<void> {
    const methods = options.navigationMethod === 'auto' 
      ? ['function', 'dots', 'arrow-keys']
      : [options.navigationMethod!];

    for (const method of methods) {
      try {
        switch (method) {
          case 'function':
            const hasFunction = await page.evaluate(() => {
              return typeof (window as any).showSlide === 'function' ||
                     typeof (window as any).goToSlide === 'function' ||
                     typeof (window as any).navigateToSlide === 'function';
            });
            
            if (hasFunction) {
              await page.evaluate((idx) => {
                if (typeof (window as any).showSlide === 'function') {
                  (window as any).showSlide(idx);
                } else if (typeof (window as any).goToSlide === 'function') {
                  (window as any).goToSlide(idx);
                } else if (typeof (window as any).navigateToSlide === 'function') {
                  (window as any).navigateToSlide(idx);
                }
              }, index);
              return;
            }
            break;

          case 'dots':
            const clicked = await page.evaluate((idx) => {
              const dots = document.querySelectorAll('.indicator-dot, .dot, .pagination-bullet');
              if (dots[idx]) {
                (dots[idx] as HTMLElement).click();
                return true;
              }
              return false;
            }, index);
            
            if (clicked) return;
            break;

          case 'arrow-keys':
            // Navigate to first slide
            if (index === 0) {
              await page.keyboard.press('Home');
            } else {
              // Press right arrow for each slide
              for (let i = 0; i < index; i++) {
                await page.keyboard.press('ArrowRight');
                await page.waitForTimeout(100);
              }
            }
            return;
        }
      } catch (error) {
        // Try next method
      }
    }

    // If no method worked, log warning
    console.warn(`⚠️  Could not navigate to slide ${index + 1}`);
  }

  private async mergePdfs(buffers: Buffer[]): Promise<PDFDocument> {
    console.log("📚 Merging slides into single PDF...");
    
    const mergedPdf = await PDFDocument.create();
    
    for (let i = 0; i < buffers.length; i++) {
      console.log(`🔗 Merging slide ${i + 1}...`);
      const doc = await PDFDocument.load(buffers[i]);
      const copiedPages = await mergedPdf.copyPages(doc, doc.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    return mergedPdf;
  }
}

export default PresentationConverter;