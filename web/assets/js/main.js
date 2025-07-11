// ULTIMATE HTML-to-PDF Converter - Perfect Full-Screen Presentations
class HTMLToPDFConverter {
    constructor() {
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.conversionOptions = document.getElementById('conversionOptions');
        this.previewArea = document.getElementById('previewArea');
        this.previewFrame = document.getElementById('previewFrame');
        this.convertBtn = document.getElementById('convertBtn');
        this.zoomIn = document.getElementById('zoomIn');
        this.zoomOut = document.getElementById('zoomOut');
        this.zoomFit = document.getElementById('zoomFit');
        this.zoomLevel = document.getElementById('zoomLevel');
        this.slideNav = document.getElementById('slideNav');
        this.prevSlide = document.getElementById('prevSlide');
        this.nextSlide = document.getElementById('nextSlide');
        this.slideCounter = document.getElementById('slideCounter');
        this.previewContainer = document.getElementById('previewContainer');
        this.previewContent = document.getElementById('previewContent');
        
        this.currentFile = null;
        this.originalHtml = null;
        this.currentZoom = 0.9;
        this.currentSlide = 0;
        this.slides = [];
        this.slideElements = [];
        this.detectedFormat = 'horizontal';
        this.previewCanvases = []; // Store pre-generated canvases
        this.isGeneratingPreviews = false;
        this.init();
        this.initCLIIntegration();
    }

    init() {
        // File upload handlers
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Convert button
        this.convertBtn.addEventListener('click', () => this.convertToPDF());
        
        // Zoom controls
        this.zoomIn.addEventListener('click', () => this.adjustZoom(0.1));
        this.zoomOut.addEventListener('click', () => this.adjustZoom(-0.1));
        this.zoomFit.addEventListener('click', () => this.fitToWindow());
        
        // Slide navigation
        this.prevSlide.addEventListener('click', () => this.navigateSlide(-1));
        this.nextSlide.addEventListener('click', () => this.navigateSlide(1));
        
        // Format change
        document.getElementById('format').addEventListener('change', () => {
            // Clear cached previews when format changes
            this.previewCanvases = [];
            this.updatePreview();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (this.previewArea.style.display !== 'none') {
                if (e.key === 'ArrowLeft') this.navigateSlide(-1);
                if (e.key === 'ArrowRight') this.navigateSlide(1);
                if (e.key === '=' || e.key === '+') this.adjustZoom(0.1);
                if (e.key === '-') this.adjustZoom(-0.1);
                if (e.key === '0') this.fitToWindow();
            }
        });
    }

    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('drag-over');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('drag-over');
    }

    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        if (files.length > 0 && this.isHTMLFile(files[0])) {
            this.processFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file && this.isHTMLFile(file)) {
            this.processFile(file);
        }
    }

    isHTMLFile(file) {
        return file.type === 'text/html' || file.name.toLowerCase().endsWith('.html') || file.name.toLowerCase().endsWith('.htm');
    }

    async processFile(file) {
        this.currentFile = file;
        const content = await this.readFileContent(file);
        this.originalHtml = content;
        
        // Parse and analyze the HTML
        this.analyzeHTML(content);
        
        // Show options and preview
        this.conversionOptions.style.display = 'block';
        this.previewArea.style.display = 'block';
        this.updatePreview();
    }

    readFileContent(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsText(file);
        });
    }

    analyzeHTML(html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Detect slides using multiple strategies
        this.slideElements = this.detectSlides(doc);
        
        // Auto-detect optimal format
        this.detectedFormat = this.detectOptimalFormat(doc);
        document.getElementById('format').value = this.detectedFormat;
        
        console.log(`🔍 Detected ${this.slideElements.length} slides, format: ${this.detectedFormat}`);
    }

    detectSlides(doc) {
        // Strategy 1: Look for common slide selectors (like your example)
        const slideSelectors = [
            '.slide',
            '.slide-1, .slide-2, .slide-3, .slide-4, .slide-5, .slide-6, .slide-7, .slide-8, .slide-9',
            'section[class*="slide"]',
            '[data-slide]',
            '.presentation > div',
            '.swiper-slide',
            '.reveal .slides section',
            '.step'
        ];
        
        for (const selector of slideSelectors) {
            const elements = doc.querySelectorAll(selector);
            if (elements.length > 0) {
                console.log(`✅ Found ${elements.length} slides using selector: ${selector}`);
                return Array.from(elements);
            }
        }
        
        // Strategy 2: Look for full-viewport sections
        const fullScreenElements = doc.querySelectorAll('[style*="100vh"], [style*="100vw"]');
        if (fullScreenElements.length > 0) {
            console.log(`✅ Found ${fullScreenElements.length} full-screen elements`);
            return Array.from(fullScreenElements);
        }
        
        // Strategy 3: Default to body as single slide
        console.log('⚠️ No slides detected, treating as single document');
        return [doc.body];
    }

    detectOptimalFormat(doc) {
        const body = doc.body;
        const style = body.style;
        
        // Check if it's a full-screen presentation
        if (style.width === '100vw' || style.height === '100vh') {
            return 'horizontal'; // Default to widescreen for presentations
        }
        
        // Check viewport meta tag
        const viewport = doc.querySelector('meta[name="viewport"]');
        if (viewport && viewport.content.includes('width=device-width')) {
            return 'horizontal';
        }
        
        // Check for presentation indicators
        const presentationKeywords = ['presentation', 'slide', 'deck'];
        const title = (doc.title || '').toLowerCase();
        const hasPresKeywords = presentationKeywords.some(keyword => title.includes(keyword));
        
        if (hasPresKeywords || this.slideElements.length > 1) {
            return 'horizontal';
        }
        
        return 'portrait'; // Default for documents
    }

    async updatePreview() {
        if (!this.originalHtml) return;
        
        // Generate actual PDF preview (canvas image)
        await this.generatePDFPreview(this.currentSlide);
        
        // Update slide navigation
        this.updateSlideNavigation();
    }

    createIsolatedSlideHTML(slideIndex, dimensions) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(this.originalHtml, 'text/html');
        
        if (this.slideElements.length > 1) {
            // Get all slides
            const slideSelector = this.getSlideSelector();
            const allSlides = doc.querySelectorAll(slideSelector);
            
            if (allSlides.length > slideIndex) {
                // Preserve the original body structure and classes
                const originalBodyClass = doc.body.className;
                const originalBodyStyle = doc.body.style.cssText;
                
                // Clone the target slide with all its styling context
                const targetSlide = allSlides[slideIndex].cloneNode(true);
                
                // Instead of clearing body, hide other slides and show target
                allSlides.forEach((slide, index) => {
                    if (index === slideIndex) {
                        // Show target slide
                        slide.style.display = '';
                        slide.style.visibility = 'visible';
                        slide.style.opacity = '1';
                        slide.classList.add('active');
                        
                        // Remove any 'display: none' that might hide it
                        const computedStyle = window.getComputedStyle ? null : slide.style;
                        if (slide.style.display === 'none') {
                            slide.style.display = '';
                        }
                    } else {
                        // Hide other slides completely
                        slide.style.display = 'none';
                        slide.style.visibility = 'hidden';
                        slide.style.opacity = '0';
                        slide.classList.remove('active');
                    }
                });
                
                // Preserve body styling
                doc.body.className = originalBodyClass;
                if (originalBodyStyle) {
                    doc.body.style.cssText = originalBodyStyle;
                }
                
                console.log(`🎯 Isolated slide ${slideIndex + 1} while preserving context`);
            } else {
                console.warn(`⚠️ Slide ${slideIndex + 1} not found, using full document`);
            }
        }
        
        // Add minimal preservation styles that don't override fonts
        this.addPerfectRenderingStyles(doc, dimensions);
        
        return '<!DOCTYPE html>' + doc.documentElement.outerHTML;
    }

    createOptimizedHTML(slideIndex) {
        // Legacy method - use the new isolated method
        const format = document.getElementById('format').value;
        const dimensions = this.getFormatDimensions(format);
        return this.createIsolatedSlideHTML(slideIndex, dimensions);
    }

    getSlideSelector() {
        // Return the selector that was used to detect slides
        const slideSelectors = ['.slide', 'section[class*="slide"]', '[data-slide]', '.presentation > div'];
        const parser = new DOMParser();
        const doc = parser.parseFromString(this.originalHtml, 'text/html');
        
        for (const selector of slideSelectors) {
            if (doc.querySelectorAll(selector).length > 0) {
                return selector;
            }
        }
        return '.slide'; // fallback
    }

    addPerfectRenderingStyles(doc, dimensions) {
        // First, preserve all existing fonts and styles
        const existingStyles = doc.querySelectorAll('style, link[rel="stylesheet"]');
        
        const style = doc.createElement('style');
        style.textContent = `
            /* PERFECT PRESERVATION SYSTEM - NO FONT CHANGES */
            
            /* Only set dimensions and positioning - PRESERVE ALL OTHER STYLES */
            html {
                width: ${dimensions.width}px !important;
                height: ${dimensions.height}px !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: hidden !important;
            }
            
            body {
                width: ${dimensions.width}px !important;
                height: ${dimensions.height}px !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: hidden !important;
                position: relative !important;
            }
            
            /* Force slide positioning ONLY - preserve all visual styles */
            .slide, .slide-1, .slide-2, .slide-3, .slide-4, .slide-5, .slide-6, .slide-7, .slide-8, .slide-9 {
                width: ${dimensions.width}px !important;
                height: ${dimensions.height}px !important;
                margin: 0 !important;
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                box-sizing: border-box !important;
                overflow: hidden !important;
                /* PRESERVE original display, flex properties, fonts, colors, etc. */
            }
            
            .slide.active {
                visibility: visible !important;
                opacity: 1 !important;
                z-index: 1 !important;
            }
            
            /* Preserve presentation containers */
            .presentation {
                width: ${dimensions.width}px !important;
                height: ${dimensions.height}px !important;
                margin: 0 !important;
                padding: 0 !important;
                position: relative !important;
                overflow: hidden !important;
            }
            
            /* Perfect image preservation */
            img {
                image-rendering: -webkit-optimize-contrast !important;
                image-rendering: crisp-edges !important;
            }
            
            /* Disable animations ONLY for clean capture */
            *, *::before, *::after {
                animation-duration: 0s !important;
                animation-delay: 0s !important;
                transition-duration: 0s !important;
                transition-delay: 0s !important;
            }
            
            /* Hide navigation elements */
            .nav-buttons, .slide-indicator, .navigation {
                display: none !important;
            }
        `;
        
        // Add our styles AFTER existing styles to preserve font definitions
        doc.head.appendChild(style);
        
        // Ensure original fonts are preserved by not adding font imports
        console.log(`🎨 Preserved ${existingStyles.length} existing style sheets`);
    }

    // Legacy method for backward compatibility
    addOptimizationStyles(doc, dimensions) {
        this.addPerfectRenderingStyles(doc, dimensions);
    }

    getFormatDimensions(format) {
        const formats = {
            horizontal: { width: 1920, height: 1080 },
            vertical: { width: 1080, height: 1920 },
            classic: { width: 1024, height: 768 },
            portrait: { width: 816, height: 1056 }
        };
        return formats[format] || formats.horizontal;
    }

    updateSlideNavigation() {
        const slideCount = Math.max(1, this.slideElements.length);
        
        if (slideCount > 1) {
            this.slideNav.style.display = 'flex';
            this.slideCounter.textContent = `${this.currentSlide + 1} / ${slideCount}`;
            this.prevSlide.disabled = this.currentSlide === 0;
            this.nextSlide.disabled = this.currentSlide === slideCount - 1;
        } else {
            this.slideNav.style.display = 'none';
        }
    }

    async generatePDFPreview(slideIndex) {
        // Check if we already have this preview
        if (this.previewCanvases[slideIndex]) {
            this.displayPreviewCanvas(slideIndex);
            return;
        }

        // Show loading only if this is the current slide being viewed
        if (slideIndex === this.currentSlide) {
            this.showPreviewLoading();
        }

        try {
            const format = document.getElementById('format').value;
            const dimensions = this.getFormatDimensions(format);

            console.log(`🎬 Generating slide ${slideIndex + 1} preview...`);

            // Create isolated HTML for this specific slide
            const slideHtml = this.createIsolatedSlideHTML(slideIndex, dimensions);

            // Create off-screen rendering container
            const tempDiv = document.createElement('div');
            tempDiv.style.cssText = `
                position: fixed;
                top: -10000px;
                left: -10000px;
                width: ${dimensions.width}px;
                height: ${dimensions.height}px;
                z-index: -1000;
                visibility: hidden;
                pointer-events: none;
            `;

            const iframe = document.createElement('iframe');
            iframe.style.cssText = `
                width: ${dimensions.width}px;
                height: ${dimensions.height}px;
                border: none;
                background: white;
            `;

            tempDiv.appendChild(iframe);
            document.body.appendChild(tempDiv);

            // Load HTML and wait for complete rendering including fonts
            await new Promise((resolve) => {
                iframe.onload = async () => {
                    // Wait for fonts to load
                    if (iframe.contentDocument.fonts && iframe.contentDocument.fonts.ready) {
                        await iframe.contentDocument.fonts.ready;
                        console.log('🔤 Fonts loaded for slide', slideIndex + 1);
                    }
                    
                    // Reduced wait time for faster conversion
                    setTimeout(resolve, 1000);
                };
                iframe.srcdoc = slideHtml;
            });

            // Ensure iframe content is properly loaded
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            if (!iframeDoc.body) {
                throw new Error('Failed to load iframe content');
            }

            // Capture the entire iframe content with perfect font preservation
            const canvas = await html2canvas(iframeDoc.documentElement, {
                width: dimensions.width,
                height: dimensions.height,
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: 'white',
                scrollX: 0,
                scrollY: 0,
                windowWidth: dimensions.width,
                windowHeight: dimensions.height,
                letterRendering: true, // Better text rendering
                foreignObjectRendering: true, // Better font support
                imageTimeout: 10000, // Wait for images
                onclone: (clonedDoc) => {
                    // Preserve all existing styles without modification
                    const clonedBody = clonedDoc.body;
                    if (clonedBody) {
                        // Only set essential positioning, preserve fonts
                        clonedBody.style.margin = '0';
                        clonedBody.style.padding = '0';
                        clonedBody.style.overflow = 'hidden';
                        
                        // Ensure fonts are loaded in the clone
                        const fontLinks = clonedDoc.querySelectorAll('link[rel="stylesheet"]');
                        fontLinks.forEach(link => {
                            if (link.href.includes('fonts.googleapis.com') || link.href.includes('fonts.gstatic.com')) {
                                console.log('🔤 Preserving font link:', link.href);
                            }
                        });
                    }
                }
            });

            // Store canvas for this slide
            this.previewCanvases[slideIndex] = canvas;

            // Clean up
            document.body.removeChild(tempDiv);

            // Display if this is the current slide
            if (slideIndex === this.currentSlide) {
                this.displayPreviewCanvas(slideIndex);
            }

            console.log(`✅ Slide ${slideIndex + 1} preview generated`);

        } catch (error) {
            console.error(`❌ Preview generation failed for slide ${slideIndex + 1}:`, error);
            if (slideIndex === this.currentSlide) {
                this.hidePreviewLoading();
            }
        }
    }

    displayPreviewCanvas(slideIndex) {
        const canvas = this.previewCanvases[slideIndex];
        if (!canvas) return;

        // Create smooth transition
        const previewContainer = this.previewContent;
        
        // Create image from canvas
        const img = document.createElement('img');
        img.src = canvas.toDataURL('image/png', 0.98);
        img.style.cssText = `
            max-width: 100%;
            max-height: 100%;
            border: 1px solid #e0e0e0;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.12);
            transform-origin: top left;
            opacity: 0;
            transition: opacity 0.3s ease-in-out;
            background: white;
        `;

        // Smooth replacement
        previewContainer.innerHTML = '';
        previewContainer.appendChild(img);
        this.previewImage = img;

        // Fade in the image
        setTimeout(() => {
            img.style.opacity = '1';
            this.applyZoom(); // Use current zoom (90%) instead of auto-fit
        }, 50);

        this.hidePreviewLoading();
    }

    startBackgroundGeneration() {
        if (this.isGeneratingPreviews) return;
        this.isGeneratingPreviews = true;

        // Generate all other slides in background
        const slideCount = Math.max(1, this.slideElements.length);
        
        setTimeout(async () => {
            for (let i = 0; i < slideCount; i++) {
                if (!this.previewCanvases[i]) {
                    console.log(`🔄 Pre-generating slide ${i + 1}...`);
                    await this.generatePDFPreview(i);
                    
                    // Small delay between generations to not block UI
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
            this.isGeneratingPreviews = false;
            console.log('✅ All slides pre-generated!');
        }, 1000);
    }

    showPreviewLoading() {
        this.previewContent.innerHTML = `
            <div style="
                display: flex; 
                flex-direction: column; 
                align-items: center; 
                justify-content: center; 
                height: 400px; 
                color: #666;
                background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                border-radius: 12px;
                border: 1px solid #e0e0e0;
            ">
                <div style="
                    width: 60px; 
                    height: 60px; 
                    border: 4px solid #f1f5f9; 
                    border-top: 4px solid #3b82f6; 
                    border-radius: 50%; 
                    animation: spin 1s linear infinite;
                    margin-bottom: 24px;
                "></div>
                <h3 style="
                    margin: 0 0 8px 0; 
                    font-size: 18px; 
                    font-weight: 600; 
                    color: #1e293b;
                ">Generating Preview</h3>
                <p style="
                    margin: 0; 
                    font-size: 14px; 
                    color: #64748b;
                    text-align: center;
                ">Creating PDF-quality preview...</p>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
    }

    hidePreviewLoading() {
        // Loading will be replaced by displayPreviewCanvas
    }

    navigateSlide(direction) {
        const slideCount = Math.max(1, this.slideElements.length);
        const newSlide = this.currentSlide + direction;
        
        if (newSlide >= 0 && newSlide < slideCount) {
            this.currentSlide = newSlide;
            this.updatePreview();
        }
    }

    adjustZoom(delta) {
        this.currentZoom = Math.max(0.1, Math.min(3, this.currentZoom + delta));
        this.applyZoom();
    }

    applyZoom() {
        if (this.previewImage) {
            this.previewImage.style.transform = `scale(${this.currentZoom})`;
            this.previewImage.style.transformOrigin = 'top left';
        }
        this.zoomLevel.textContent = Math.round(this.currentZoom * 100) + '%';
    }

    fitToWindow() {
        if (!this.previewImage) return;
        
        const containerWidth = this.previewContainer.offsetWidth - 40; // Account for padding
        const containerHeight = this.previewContainer.offsetHeight - 40;
        const imgWidth = this.previewImage.naturalWidth || this.previewImage.offsetWidth;
        const imgHeight = this.previewImage.naturalHeight || this.previewImage.offsetHeight;
        
        const scaleX = containerWidth / imgWidth;
        const scaleY = containerHeight / imgHeight;
        
        this.currentZoom = Math.min(scaleX, scaleY, 0.9); // Max zoom 90%
        this.applyZoom();
    }

    async convertToPDF() {
        if (!this.originalHtml) return;
        
        // Show immediate loading indicator on button
        this.showButtonLoading();
        
        // Show immediate loading spinner overlay
        this.showLoadingSpinner();
        
        // Show loading spinner for minimum 800ms, then start conversion
        setTimeout(async () => {
            this.hideLoadingSpinner();
            this.showProgressBar();
            await this.performConversion();
        }, 800); // Show for 800ms minimum
    }

    async performConversion() {
        try {
            const format = document.getElementById('format').value;
            const margin = parseInt(document.getElementById('margin').value) || 0;
            const dimensions = this.getFormatDimensions(format);
            const slideCount = Math.max(1, this.slideElements.length);
            
            // Create PDF using jsPDF
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: dimensions.width > dimensions.height ? 'landscape' : 'portrait',
                unit: 'px',
                format: [dimensions.width, dimensions.height],
                compress: true
            });
            
            console.log(`🚀 Converting ${slideCount} slides to PDF...`);
            
            // Process each slide
            for (let i = 0; i < slideCount; i++) {
                if (i > 0) pdf.addPage();
                
                // Update progress
                const progress = ((i + 1) / slideCount) * 100;
                this.updateProgress(progress, `Converting slide ${i + 1} of ${slideCount}`);
                this.convertBtn.textContent = `🔄 Converting... (${i + 1}/${slideCount})`;
                
                let canvas;
                
                // Use pre-generated canvas if available, otherwise generate on-demand
                if (this.previewCanvases[i]) {
                    console.log(`✅ Using pre-generated slide ${i + 1}`);
                    canvas = this.previewCanvases[i];
                } else {
                    console.log(`📄 Generating slide ${i + 1} on-demand...`);
                    
                    // Generate this slide (same logic as preview generation)
                    const slideHtml = this.createOptimizedHTML(i);
                    const scale = parseFloat(document.getElementById('scale').value) || 1;
                    
                    const tempDiv = document.createElement('div');
                    tempDiv.style.cssText = `
                        position: fixed;
                        top: -${dimensions.height * 2}px;
                        left: -${dimensions.width * 2}px;
                        width: ${dimensions.width}px;
                        height: ${dimensions.height}px;
                        z-index: -1000;
                        background: white;
                        overflow: hidden;
                    `;
                    
                    const iframe = document.createElement('iframe');
                    iframe.style.cssText = `
                        width: ${dimensions.width}px;
                        height: ${dimensions.height}px;
                        border: none;
                        transform: scale(${scale});
                        transform-origin: top left;
                    `;
                    
                    tempDiv.appendChild(iframe);
                    document.body.appendChild(tempDiv);
                    
                    // Load HTML and wait for rendering including fonts
                    await new Promise((resolve) => {
                        iframe.onload = async () => {
                            // Wait for fonts to load in PDF conversion too
                            if (iframe.contentDocument.fonts && iframe.contentDocument.fonts.ready) {
                                await iframe.contentDocument.fonts.ready;
                                console.log('🔤 Fonts loaded for PDF slide', i + 1);
                            }
                            
                            setTimeout(resolve, 800);
                        };
                        iframe.srcdoc = slideHtml;
                    });
                    
                    // Capture with html2canvas - optimized for speed
                    canvas = await html2canvas(iframe.contentDocument.documentElement, {
                        width: dimensions.width,
                        height: dimensions.height,
                        scale: 1.5, // Reduced scale for faster processing
                        useCORS: true,
                        allowTaint: true,
                        backgroundColor: 'white',
                        scrollX: 0,
                        scrollY: 0,
                        windowWidth: dimensions.width,
                        windowHeight: dimensions.height,
                        letterRendering: true, // Better text rendering
                        foreignObjectRendering: true, // Better font support
                        imageTimeout: 5000, // Reduced timeout for speed
                        onclone: (clonedDoc) => {
                            // Preserve fonts in PDF generation too
                            const clonedBody = clonedDoc.body;
                            if (clonedBody) {
                                clonedBody.style.margin = '0';
                                clonedBody.style.padding = '0';
                                clonedBody.style.overflow = 'hidden';
                            }
                        }
                    });
                    
                    document.body.removeChild(tempDiv);
                }
                
                // Add to PDF
                const imgData = canvas.toDataURL('image/png', 0.95);
                pdf.addImage(imgData, 'PNG', margin, margin, 
                    dimensions.width - (margin * 2), 
                    dimensions.height - (margin * 2));
                
                console.log(`✅ Slide ${i + 1} added to PDF`);
            }
            
            // Download PDF
            const filename = this.currentFile ? 
                this.currentFile.name.replace(/\.[^/.]+$/, '') + '_presentation.pdf' : 
                'presentation.pdf';
            
            // Show completion
            this.updateProgress(100, 'Finalizing PDF...');
            
            pdf.save(filename);
            
            console.log('🎉 PDF generated successfully!');
            this.hideProgressBar();
            
        } catch (error) {
            console.error('❌ PDF generation failed:', error);
            this.hideProgressBar();
            alert('PDF generation failed. Please check console for details.');
        } finally {
            this.resetButton();
        }
    }

    showProgressBar() {
        // Create progress overlay
        const overlay = document.createElement('div');
        overlay.id = 'progressOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            backdrop-filter: blur(5px);
        `;

        const progressContainer = document.createElement('div');
        progressContainer.style.cssText = `
            background: white;
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            text-align: center;
            min-width: 400px;
            max-width: 500px;
        `;

        progressContainer.innerHTML = `
            <div style="margin-bottom: 24px;">
                <svg width="64" height="64" viewBox="0 0 64 64" style="margin-bottom: 16px;">
                    <circle cx="32" cy="32" r="28" stroke="#e0e0e0" stroke-width="4" fill="none"/>
                    <circle id="progressCircle" cx="32" cy="32" r="28" stroke="#6B5B4F" stroke-width="4" 
                            fill="none" stroke-linecap="round" stroke-dasharray="176" stroke-dashoffset="176"
                            transform="rotate(-90 32 32)" style="transition: stroke-dashoffset 0.3s ease;"/>
                </svg>
                <h3 id="progressTitle" style="margin: 0; color: #2C2825; font-size: 20px;">Converting to PDF</h3>
                <p id="progressText" style="margin: 8px 0 0 0; color: #5A524B; font-size: 14px;">Preparing conversion...</p>
            </div>
            <div style="background: #f8f9fa; border-radius: 8px; height: 8px; overflow: hidden; margin-bottom: 16px;">
                <div id="progressBar" style="height: 100%; background: linear-gradient(90deg, #6B5B4F, #D4A574); width: 0%; transition: width 0.3s ease;"></div>
            </div>
            <p id="progressPercent" style="margin: 0; color: #6B5B4F; font-weight: 600; font-size: 16px;">0%</p>
        `;

        overlay.appendChild(progressContainer);
        document.body.appendChild(overlay);
    }

    updateProgress(percent, message) {
        const progressBar = document.getElementById('progressBar');
        const progressPercent = document.getElementById('progressPercent');
        const progressText = document.getElementById('progressText');
        const progressCircle = document.getElementById('progressCircle');

        if (progressBar) {
            progressBar.style.width = percent + '%';
            progressPercent.textContent = Math.round(percent) + '%';
            progressText.textContent = message;
            
            // Update circular progress
            const circumference = 176; // 2 * π * r (r=28)
            const offset = circumference - (percent / 100) * circumference;
            progressCircle.style.strokeDashoffset = offset;
        }
    }

    hideProgressBar() {
        const overlay = document.getElementById('progressOverlay');
        if (overlay) {
            // Fade out animation
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.3s ease';
            setTimeout(() => {
                overlay.remove();
            }, 300);
        }
        
        // Also hide the loading spinner in case it's still showing
        this.hideLoadingSpinner();
    }

    showLoadingSpinner() {
        // Create subtle loading indicator in the conversion settings area
        const conversionOptions = document.getElementById('conversionOptions');
        if (!conversionOptions) return;

        // Create loading indicator element
        const loader = document.createElement('div');
        loader.id = 'loadingSpinner';
        loader.style.cssText = `
            margin-top: 16px;
            padding: 20px 24px;
            background: linear-gradient(135deg, rgba(107, 91, 79, 0.04) 0%, rgba(212, 165, 116, 0.06) 100%);
            border: 1px solid rgba(107, 91, 79, 0.12);
            border-radius: 12px;
            display: flex;
            align-items: center;
            gap: 16px;
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 16px rgba(107, 91, 79, 0.08);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        `;

        // Create modern pulsing dots animation
        const loadingDots = document.createElement('div');
        loadingDots.style.cssText = `
            display: flex;
            gap: 4px;
            align-items: center;
        `;

        // Create 3 pulsing dots
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dot.style.cssText = `
                width: 8px;
                height: 8px;
                background: linear-gradient(135deg, #6B5B4F 0%, #D4A574 100%);
                border-radius: 50%;
                animation: pulse-dot 1.4s ease-in-out infinite;
                animation-delay: ${i * 0.2}s;
                box-shadow: 0 2px 4px rgba(107, 91, 79, 0.2);
            `;
            loadingDots.appendChild(dot);
        }

        // Create text
        const loadingText = document.createElement('span');
        loadingText.textContent = 'Preparing your PDF...';
        loadingText.style.cssText = `
            color: #6B5B4F;
            font-size: 15px;
            font-weight: 500;
            letter-spacing: 0.3px;
        `;

        // Add the keyframes
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse-dot {
                0%, 100% { 
                    transform: scale(1); 
                    opacity: 0.7; 
                }
                50% { 
                    transform: scale(1.3); 
                    opacity: 1; 
                }
            }
        `;

        loader.appendChild(loadingDots);
        loader.appendChild(loadingText);
        document.head.appendChild(style);
        
        // Insert the loader right after the convert button
        const convertBtn = document.getElementById('convertBtn');
        if (convertBtn && convertBtn.parentNode) {
            convertBtn.parentNode.insertBefore(loader, convertBtn.nextSibling);
        } else {
            // Fallback: add to conversionOptions directly
            conversionOptions.appendChild(loader);
        }
    }

    hideLoadingSpinner() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.remove();
        }
        
        // Remove added styles
        const addedStyles = document.querySelectorAll('style');
        addedStyles.forEach(style => {
            if (style.textContent.includes('@keyframes pulse-dot')) {
                style.remove();
            }
        });
    }

    showButtonLoading() {
        this.convertBtn.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <div style="
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top: 2px solid white;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                "></div>
                Preparing...
            </div>
        `;
        this.convertBtn.disabled = true;
        this.convertBtn.style.opacity = '0.8';
    }

    resetButton() {
        this.convertBtn.innerHTML = '📄 Download PDF';
        this.convertBtn.disabled = false;
        this.convertBtn.style.opacity = '1';
        
        // Ensure loading spinner is hidden when resetting button
        this.hideLoadingSpinner();
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    new HTMLToPDFConverter();
    initMobileMenu();
    console.log('🚀 HTML-to-PDF Converter initialized');
});

// Mobile menu functionality
function initMobileMenu() {
    const mobileToggle = document.getElementById('mobileMenuToggle');
    const nav = document.getElementById('nav');
    
    if (mobileToggle && nav) {
        mobileToggle.addEventListener('click', () => {
            mobileToggle.classList.toggle('active');
            nav.classList.toggle('mobile-open');
        });

        // Close menu when clicking on a link
        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileToggle.classList.remove('active');
                nav.classList.remove('mobile-open');
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!mobileToggle.contains(e.target) && !nav.contains(e.target)) {
                mobileToggle.classList.remove('active');
                nav.classList.remove('mobile-open');
            }
        });
    }
}

// CLI Tools Functions
function downloadCLI() {
    // Check if CLI tools are available
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // Local development - check for CLI script
        fetch('./tools/pdf-server.js')
            .then(response => {
                if (response.ok) {
                    const blob = new Blob([response.body], { type: 'application/javascript' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'claude-pdf-cli.cjs';
                    a.click();
                    URL.revokeObjectURL(url);
                    
                    // Show installation instructions
                    alert('CLI downloaded!\n\nTo install:\n1. Save the file to your project\n2. Run: node claude-pdf-cli.cjs convert your-file.html\n3. Or create a global install with npm');
                } else {
                    showCLIInfo();
                }
            })
            .catch(() => showCLIInfo());
    } else {
        showCLIInfo();
    }
}

function showCLIInfo() {
    const instructions = `
CLI Tools Installation:

1. Download this repository:
   git clone https://github.com/jbabcanec/Claude_HTML-to-PDF.git

2. Install dependencies:
   cd Claude_HTML-to-PDF
   npm install

3. Use the CLI:
   node tools/pdf-server.js

4. Or use the converter CLI:
   node tools/cli-converter.js your-file.html

For global installation, see the GitHub repository for package.json setup.
    `;
    
    alert(instructions);
    
    // Also copy to clipboard if available
    if (navigator.clipboard) {
        navigator.clipboard.writeText(instructions);
    }
}

function viewDocs() {
    // Open GitHub repository
    window.open('https://github.com/jbabcanec/Claude_HTML-to-PDF#cli-usage', '_blank');
}

// Add CLI functionality to the main converter
HTMLToPDFConverter.prototype.initCLIIntegration = function() {
    // Add a CLI mode toggle to the interface
    const cliToggle = document.createElement('div');
    cliToggle.className = 'cli-toggle';
    cliToggle.innerHTML = `
        <label>
            <input type="checkbox" id="cliMode"> 
            <span>CLI Mode (show commands)</span>
        </label>
    `;
    
    const conversionOptions = document.getElementById('conversionOptions');
    if (conversionOptions) {
        conversionOptions.appendChild(cliToggle);
        
        // Add CLI command display
        const cliCommands = document.createElement('div');
        cliCommands.id = 'cliCommands';
        cliCommands.style.display = 'none';
        cliCommands.className = 'cli-commands';
        
        conversionOptions.appendChild(cliCommands);
        
        // Toggle CLI commands display
        document.getElementById('cliMode').addEventListener('change', (e) => {
            if (e.target.checked) {
                this.showCLICommands();
            } else {
                cliCommands.style.display = 'none';
            }
        });
    }
};

HTMLToPDFConverter.prototype.showCLICommands = function() {
    const cliCommands = document.getElementById('cliCommands');
    const filename = this.currentFile ? this.currentFile.name : 'presentation.html';
    const format = document.getElementById('format').value;
    
    cliCommands.innerHTML = `
        <h4>Equivalent CLI Commands:</h4>
        <div class="cli-command">
            <code>node tools/pdf-server.js</code>
            <button onclick="copyToClipboard('node tools/pdf-server.js')">📋</button>
        </div>
        <div class="cli-command">
            <code>node tools/cli-converter.js ${filename} --format=${format}</code>
            <button onclick="copyToClipboard('node tools/cli-converter.js ${filename} --format=${format}')">📋</button>
        </div>
        <p class="cli-note">Run these commands in the project directory after downloading the repository.</p>
    `;
    cliCommands.style.display = 'block';
};

function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            // Show temporary success message
            const button = event.target;
            const originalText = button.textContent;
            button.textContent = '✅';
            setTimeout(() => {
                button.textContent = originalText;
            }, 2000);
        });
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Command copied to clipboard!');
    }
}

// Claude Prompts Functions
function copyPrompt(button) {
    const prompt = button.getAttribute('data-prompt');
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(prompt).then(() => {
            // Show success feedback
            const originalText = button.textContent;
            button.textContent = '✅ Copied!';
            button.classList.add('copied');
            
            setTimeout(() => {
                button.textContent = originalText;
                button.classList.remove('copied');
            }, 2000);
        });
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = prompt;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        // Show feedback
        const originalText = button.textContent;
        button.textContent = '✅ Copied!';
        setTimeout(() => {
            button.textContent = originalText;
        }, 2000);
    }
}

function showAllPrompts() {
    // Show a modal with more prompts or redirect to the full guide
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        backdrop-filter: blur(5px);
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
        background: white;
        padding: 40px;
        border-radius: 16px;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        text-align: center;
    `;
    
    content.innerHTML = `
        <h2 style="margin-bottom: 20px; color: #6B5B4F;">More Claude Prompts</h2>
        <p style="margin-bottom: 30px; color: #5A524B; line-height: 1.6;">
            Access our complete collection of prompts including:<br>
            • Product Launch presentations<br>
            • Marketing campaign decks<br>
            • Educational content templates<br>
            • Quarterly business reviews<br>
            • Technical architecture docs<br>
            • Advanced styling guidelines
        </p>
        <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
            <a href="docs/PROMPTING_GUIDE.md" target="_blank" style="
                background: #6B5B4F;
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                text-decoration: none;
                font-weight: 600;
                transition: all 0.2s ease;
            " onmouseover="this.style.background='#5a4a3e'" onmouseout="this.style.background='#6B5B4F'">
                📖 Complete Guide
            </a>
            <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
                background: #E8E3DD;
                color: #6B5B4F;
                padding: 12px 24px;
                border: none;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
            " onmouseover="this.style.background='#dad5cd'" onmouseout="this.style.background='#E8E3DD'">
                Close
            </button>
        </div>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}