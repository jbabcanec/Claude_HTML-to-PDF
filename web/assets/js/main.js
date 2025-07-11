// Main application logic
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
        this.currentZoom = 1.0;
        this.currentSlide = 0;
        this.slides = [];
        this.currentSlideInfo = null;
        this.init();
    }

    init() {
        // File upload handlers - simpler, more reliable approach
        this.uploadArea.addEventListener('click', (e) => {
            this.triggerFileInput();
        });
        
        // Also add keyboard accessibility
        this.uploadArea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.triggerFileInput();
            }
        });
        
        // Make upload area focusable
        this.uploadArea.setAttribute('tabindex', '0');
        this.uploadArea.setAttribute('role', 'button');
        this.uploadArea.setAttribute('aria-label', 'Click to upload HTML file');
        
        this.fileInput.addEventListener('change', (e) => {
            this.handleFileSelect(e);
        });
        
        // Drag and drop handlers
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        
        // Convert button handler
        this.convertBtn.addEventListener('click', () => this.convertToPDF());
        
        // Zoom controls
        this.zoomIn.addEventListener('click', () => this.zoomPreview(0.25));
        this.zoomOut.addEventListener('click', () => this.zoomPreview(-0.25));
        this.zoomFit.addEventListener('click', () => this.fitToWindow());
        
        // Slide navigation
        this.prevSlide.addEventListener('click', () => this.navigateSlide(-1));
        this.nextSlide.addEventListener('click', () => this.navigateSlide(1));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (this.previewArea.style.display !== 'none') {
                if (e.key === 'ArrowLeft') this.navigateSlide(-1);
                if (e.key === 'ArrowRight') this.navigateSlide(1);
                if (e.key === '=' || e.key === '+') this.zoomPreview(0.25);
                if (e.key === '-') this.zoomPreview(-0.25);
                if (e.key === '0') this.fitToWindow();
            }
        });
        
        // Smooth scroll for navigation
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }

    triggerFileInput() {
        // Direct approach - most reliable for user-initiated events
        this.fileInput.click();
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
        } else {
            this.showError('Please upload an HTML file');
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file && this.isHTMLFile(file)) {
            this.processFile(file);
        } else {
            this.showError('Please upload an HTML file');
        }
    }

    isHTMLFile(file) {
        return file.type === 'text/html' || 
               file.name.endsWith('.html') || 
               file.name.endsWith('.htm');
    }

    async processFile(file) {
        this.currentFile = file;
        
        // Show conversion options
        this.conversionOptions.style.display = 'block';
        
        // Analyze slide structure for better detection
        this.analyzeSlideStructure();
        
        // Read and preview file
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            this.showPreview(content);
            this.detectPresentationFormat(content);
        };
        reader.readAsText(file);
        
        // Update UI
        this.uploadArea.querySelector('h3').textContent = file.name;
        this.uploadArea.querySelector('p').textContent = `${(file.size / 1024).toFixed(2)} KB`;
    }

    async showPreview(htmlContent) {
        this.previewArea.style.display = 'block';
        
        // Reset to initial state
        this.currentZoom = 1.0;
        this.currentSlide = 0;
        this.slides = [];
        this.updateZoomDisplay();
        
        // Enhanced slide structure detection
        const slideInfo = await this.detectSlideStructure(htmlContent);
        console.log('🔍 Slide detection result:', slideInfo);
        
        // Store slide info for PDF generation
        this.currentSlideInfo = slideInfo;
        
        if (slideInfo.slideCount > 1) {
            // Extract and prepare slides with proper isolation
            await this.prepareSlides(htmlContent, slideInfo);
            this.showSlideNavigation();
        } else {
            // Single page with enhanced preview
            this.slides = [{ content: htmlContent, title: 'Full Document' }];
            this.hideSlideNavigation();
        }
        
        // Show the current slide with enhanced preview
        this.showCurrentSlide();
    }
    
    async prepareSlides(htmlContent, slideInfo) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        
        // Find all slide elements using the detected selector
        const slideElements = doc.querySelectorAll(slideInfo.slideSelector);
        
        this.slides = [];
        slideElements.forEach((slide, index) => {
            // Create an enhanced isolated slide HTML
            const slideHtml = this.createEnhancedSlideHtml(htmlContent, slideInfo, index);
            this.slides.push({
                content: slideHtml,
                title: `Slide ${index + 1}`,
                index: index,
                method: slideInfo.method
            });
        });
        
        console.log(`📄 Prepared ${this.slides.length} slides for enhanced preview`);
    }
    
    extractBaseStyles(doc) {
        const styles = [];
        const styleElements = doc.querySelectorAll('style, link[rel="stylesheet"]');
        
        styleElements.forEach(style => {
            if (style.tagName === 'STYLE') {
                styles.push(style.outerHTML);
            } else if (style.tagName === 'LINK') {
                styles.push(style.outerHTML);
            }
        });
        
        return styles.join('\n');
    }
    
    createEnhancedSlideHtml(originalHtml, slideInfo, index) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(originalHtml, 'text/html');
        
        // Enhanced slide isolation based on slide type
        const allSlides = doc.querySelectorAll(slideInfo.slideSelector);
        
        // Hide all slides except the current one
        allSlides.forEach((slide, i) => {
            if (i !== index) {
                slide.style.display = 'none';
                slide.style.visibility = 'hidden';
            } else {
                // Ensure current slide is visible and properly positioned
                slide.style.display = '';
                slide.style.visibility = 'visible';
                slide.classList.add('active');
            }
        });
        
        // Add enhanced preview styles
        const previewStyle = doc.createElement('style');
        previewStyle.textContent = `
            /* Enhanced Preview Styles */
            body {
                margin: 0 !important;
                padding: 0 !important;
                overflow: hidden !important;
                background: white !important;
            }
            
            /* Standard slide enhancement */
            .slide {
                width: 100% !important;
                height: 100vh !important;
                position: relative !important;
                box-sizing: border-box !important;
            }
            
            .slide.active {
                display: flex !important;
                visibility: visible !important;
            }
            
            /* Hide navigation elements in preview */
            .nav-dots, .navigation, .slide-nav {
                display: none !important;
            }
            
            /* Ensure proper sizing for different slide types */
            ${slideInfo.method === 'reveal-js' ? `
                .reveal .slides section {
                    width: 100% !important;
                    height: 100vh !important;
                }
            ` : ''}
            
            ${slideInfo.method === 'swiper' ? `
                .swiper-slide {
                    width: 100% !important;
                    height: 100vh !important;
                }
            ` : ''}
        `;
        doc.head.appendChild(previewStyle);
        
        return doc.documentElement.outerHTML;
    }
    
    showCurrentSlide() {
        if (this.slides.length === 0) return;

        const currentSlide = this.slides[this.currentSlide];
        
        // Create blob URL for current slide
        const blob = new Blob([currentSlide.content], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        // Update iframe with proper settings
        this.previewFrame.src = url;

        // Clean up previous blob URL
        this.previewFrame.onload = () => {
            URL.revokeObjectURL(url);
            this.adjustIframeSize();
            this.applyZoom();
        };
        
        // Update slide counter
        this.updateSlideCounter();
    }
    
    showSlideNavigation() {
        this.slideNav.style.display = 'flex';
        this.updateSlideCounter();
    }
    
    hideSlideNavigation() {
        this.slideNav.style.display = 'none';
    }
    
    updateSlideCounter() {
        if (this.slides.length > 1) {
            this.slideCounter.textContent = `${this.currentSlide + 1} / ${this.slides.length}`;
        } else {
            this.slideCounter.textContent = '1 / 1';
        }
    }
    
    navigateSlide(direction) {
        if (this.slides.length <= 1) return;
        
        this.currentSlide = Math.max(0, Math.min(this.slides.length - 1, this.currentSlide + direction));
        this.showCurrentSlide();
    }
    
    zoomPreview(delta) {
        this.currentZoom = Math.max(0.25, Math.min(3.0, this.currentZoom + delta));
        this.applyZoom();
        this.updateZoomDisplay();
    }
    
    fitToWindow() {
        // Calculate optimal zoom to fit content in container
        const containerWidth = this.previewContainer.offsetWidth - 40; // Account for padding
        const containerHeight = this.previewContainer.offsetHeight - 40;
        const frameWidth = this.previewFrame.offsetWidth;
        const frameHeight = this.previewFrame.offsetHeight;
        
        const scaleX = containerWidth / frameWidth;
        const scaleY = containerHeight / frameHeight;
        
        // Use the smaller scale to ensure content fits in both dimensions
        this.currentZoom = Math.min(scaleX, scaleY, 1.0); // Don't zoom beyond 100%
        this.applyZoom();
        this.updateZoomDisplay();
    }
    
    applyZoom() {
        // Enhanced zoom system that maintains aspect ratio
        this.previewFrame.style.transform = `scale(${this.currentZoom})`;
        this.previewFrame.style.transformOrigin = 'top left';
        
        // Calculate proper container dimensions
        const baseWidth = this.previewFrame.offsetWidth;
        const baseHeight = this.previewFrame.offsetHeight;
        const scaledWidth = baseWidth * this.currentZoom;
        const scaledHeight = baseHeight * this.currentZoom;
        
        // Update container to properly contain scaled content
        this.previewContent.style.width = `${scaledWidth}px`;
        this.previewContent.style.height = `${scaledHeight}px`;
        this.previewContent.style.minWidth = `${scaledWidth}px`;
        this.previewContent.style.minHeight = `${scaledHeight}px`;
        
        // Adjust preview container scroll behavior
        this.previewContainer.style.overflow = this.currentZoom > 1 ? 'auto' : 'hidden';
    }

    adjustIframeSize() {
        try {
            const doc = this.previewFrame.contentDocument || this.previewFrame.contentWindow.document;
            const slide = doc.querySelector('.slide') || doc.body;
            const rect = slide.getBoundingClientRect();
            this.previewFrame.style.width = rect.width + 'px';
            this.previewFrame.style.height = rect.height + 'px';
        } catch (e) {
            // Fallback to default size
            this.previewFrame.style.width = '100%';
            this.previewFrame.style.height = '600px';
        }
    }
    
    updateZoomDisplay() {
        this.zoomLevel.textContent = `${Math.round(this.currentZoom * 100)}%`;
    }

    detectPresentationFormat(htmlContent) {
        // Enhanced detection logic with 8.5x11 portrait detection
        const formatSelect = document.getElementById('format');
        
        // Check for explicit format indicators first
        if (htmlContent.includes('width=1920') || htmlContent.includes('16:9')) {
            formatSelect.value = 'horizontal';
        } else if (htmlContent.includes('width=1080') || htmlContent.includes('9:16')) {
            formatSelect.value = 'vertical';
        } else if (htmlContent.includes('4:3') || htmlContent.includes('width=1024')) {
            formatSelect.value = 'classic';
        } else if (htmlContent.includes('8.5x11') || htmlContent.includes('612x792')) {
            formatSelect.value = 'portrait';
        } else {
            // Check for portrait suitability
            const portraitScore = this.calculatePortraitScore(htmlContent);
            if (portraitScore >= 3) {
                formatSelect.value = 'portrait';
                console.log('✨ Auto-detected portrait format! Score:', portraitScore);
            } else {
                formatSelect.value = 'auto';
            }
        }
    }

    calculatePortraitScore(htmlContent) {
        let score = 0;
        
        // Remove HTML tags to get plain text
        const textContent = htmlContent.replace(/<[^>]*>/g, '').trim();
        
        // Score based on text density (more text = more suitable for portrait)
        if (textContent.length > 2000) score += 2;
        else if (textContent.length > 1000) score += 1;
        
        // Score based on list content (lists work better in portrait)
        const listMatches = htmlContent.match(/<[uo]l|<li|<dt|<dd/gi);
        if (listMatches) {
            if (listMatches.length > 15) score += 2;
            else if (listMatches.length > 8) score += 1;
        }
        
        // Score based on paragraphs (more paragraphs = better for portrait)
        const paragraphMatches = htmlContent.match(/<p[^>]*>/gi);
        if (paragraphMatches) {
            if (paragraphMatches.length > 8) score += 2;
            else if (paragraphMatches.length > 4) score += 1;
        }
        
        // Score based on document-style keywords
        const documentKeywords = /\b(document|report|article|paper|memo|letter|notes|meeting|agenda|minutes|policy|manual|guide|instructions|procedure|specification|requirements|analysis|summary|overview|outline|checklist|todo|list|bullet|points)\b/gi;
        const keywordMatches = htmlContent.match(documentKeywords);
        if (keywordMatches) {
            if (keywordMatches.length > 5) score += 2;
            else if (keywordMatches.length > 2) score += 1;
        }
        
        // Score based on heading structure (many headings = document-like)
        const headingMatches = htmlContent.match(/<h[1-6][^>]*>/gi);
        if (headingMatches) {
            if (headingMatches.length > 6) score += 1;
            else if (headingMatches.length > 3) score += 0.5;
        }
        
        // Negative score for presentation indicators
        const presentationKeywords = /\b(slide|presentation|deck|slideshow|reveal|swiper|carousel|gallery|showcase)\b/gi;
        const presentationMatches = htmlContent.match(presentationKeywords);
        if (presentationMatches && presentationMatches.length > 2) {
            score -= 1;
        }
        
        // Negative score for media-heavy content
        const mediaMatches = htmlContent.match(/<img|<video|<canvas|<svg/gi);
        if (mediaMatches && mediaMatches.length > 5) {
            score -= 1;
        }
        
        return Math.max(0, score); // Don't go below 0
    }

    async analyzeSlideStructure() {
        if (!this.currentFile) return;
        
        const htmlContent = await this.getFileContent(this.currentFile);
        const slideInfo = this.detectSlideStructure(htmlContent);
        
        console.log('📊 Slide Analysis:', slideInfo);
        
        // Update UI with slide information
        this.displaySlideInfo(slideInfo);
    }

    async detectSlideStructure(htmlContent) {
        const info = {
            type: 'single-page',
            slideCount: 1,
            method: 'none',
            isHorizontalScroll: false,
            suggestions: [],
            slideSelector: '.slide',
            navigationMethod: 'none'
        };
        
        // Enhanced slide detection with multiple methods
        const detectionMethods = [
            this.detectStandardSlides(htmlContent),
            this.detectRevealJsSlides(htmlContent),
            this.detectSwiperSlides(htmlContent),
            this.detectCustomSlides(htmlContent)
        ];
        
        // Find the best detection method
        let bestMethod = null;
        let maxSlides = 0;
        
        for (const method of detectionMethods) {
            if (method.slideCount > maxSlides) {
                maxSlides = method.slideCount;
                bestMethod = method;
            }
        }
        
        if (bestMethod && bestMethod.slideCount > 1) {
            Object.assign(info, bestMethod);
            info.suggestions.push(`Found ${bestMethod.slideCount} slides using ${bestMethod.method}`);
            
            // Check for horizontal scroll behavior
            if (this.isHorizontalScrollPresentation(htmlContent)) {
                info.isHorizontalScroll = true;
                info.suggestions.push('Horizontal scroll presentation detected');
            }
        }
        
        return info;
    }

    detectStandardSlides(htmlContent) {
        const slideElements = htmlContent.match(/<div[^>]*class="[^"]*slide[^"]*"/gi);
        return {
            slideCount: slideElements ? slideElements.length : 0,
            method: 'standard-slides',
            type: 'slide-based',
            slideSelector: '.slide',
            navigationMethod: 'function'
        };
    }
    
    detectRevealJsSlides(htmlContent) {
        const revealSlides = htmlContent.match(/<section[^>]*>/gi);
        const hasReveal = htmlContent.includes('reveal.js') || htmlContent.includes('reveal');
        return {
            slideCount: (hasReveal && revealSlides) ? revealSlides.length : 0,
            method: 'reveal-js',
            type: 'reveal-presentation',
            slideSelector: '.reveal .slides section',
            navigationMethod: 'reveal'
        };
    }
    
    detectSwiperSlides(htmlContent) {
        const swiperSlides = htmlContent.match(/<div[^>]*class="[^"]*swiper-slide[^"]*"/gi);
        return {
            slideCount: swiperSlides ? swiperSlides.length : 0,
            method: 'swiper',
            type: 'swiper-presentation',
            slideSelector: '.swiper-slide',
            navigationMethod: 'swiper'
        };
    }
    
    detectCustomSlides(htmlContent) {
        // Check for other possible slide patterns
        const patterns = [
            /<div[^>]*class="[^"]*page[^"]*"/gi,
            /<div[^>]*class="[^"]*step[^"]*"/gi,
            /<article[^>]*>/gi
        ];
        
        let maxCount = 0;
        let bestPattern = '';
        
        for (const pattern of patterns) {
            const matches = htmlContent.match(pattern);
            if (matches && matches.length > maxCount) {
                maxCount = matches.length;
                bestPattern = pattern.toString();
            }
        }
        
        return {
            slideCount: maxCount,
            method: 'custom-slides',
            type: 'custom-presentation',
            slideSelector: bestPattern.includes('page') ? '.page' : bestPattern.includes('step') ? '.step' : 'article',
            navigationMethod: 'custom'
        };
    }
    
    isHorizontalScrollPresentation(htmlContent) {
        const horizontalIndicators = [
            /overflow-x:\s*scroll/gi,
            /overflow-x:\s*auto/gi,
            /scroll-snap-type:\s*x/gi,
            /display:\s*flex[^;]*flex-direction:\s*row/gi,
            /white-space:\s*nowrap/gi,
            /transform:\s*translateX/gi
        ];
        
        return horizontalIndicators.some(pattern => pattern.test(htmlContent));
    }

    estimateScrollSlides(htmlContent) {
        // Look for elements that might be slides in a horizontal scroll
        const possibleSlides = [
            /<div[^>]*style="[^"]*(?:width|min-width)[^"]*"/gi,
            /<section[^>]*>/gi,
            /<article[^>]*>/gi
        ];
        
        let maxCount = 1;
        possibleSlides.forEach(pattern => {
            const matches = htmlContent.match(pattern);
            if (matches) {
                maxCount = Math.max(maxCount, matches.length);
            }
        });
        
        return Math.min(maxCount, 10); // Cap at 10 slides
    }

    displaySlideInfo(slideInfo) {
        const conversionOptions = document.getElementById('conversionOptions');
        let infoElement = document.getElementById('slideInfo');
        
        if (!infoElement) {
            infoElement = document.createElement('div');
            infoElement.id = 'slideInfo';
            infoElement.style.cssText = `
                background: #e8f4f8;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 20px;
                font-size: 14px;
                border-left: 4px solid #17a2b8;
            `;
            conversionOptions.insertBefore(infoElement, conversionOptions.firstChild);
        }
        
        infoElement.innerHTML = `
            <strong>📊 Slide Analysis:</strong><br>
            Type: ${slideInfo.type}<br>
            Estimated slides: ${slideInfo.slideCount}<br>
            ${slideInfo.suggestions.join('<br>')}
        `;
    }

    async generateEnhancedPDF() {
        if (!this.currentFile) {
            this.showError('No file selected');
            return;
        }

        const convertBtn = document.getElementById('convertBtn');
        convertBtn.textContent = '⏳ Generating PDF...';
        convertBtn.disabled = true;

        try {
            // Get conversion options
            const options = this.getConversionOptions();
            
            // Create enhanced PDF document
            const pdfHtml = await this.createEnhancedPdfDocument(options);
            
            // Open in new window for printing with proper print settings
            this.openEnhancedPrintDialog(pdfHtml, options);
            
        } catch (error) {
            console.error('Enhanced PDF generation failed:', error);
            this.showError('PDF generation failed. Please try again.');
        } finally {
            convertBtn.textContent = '📄 Download PDF';
            convertBtn.disabled = false;
        }
    }
    
    openEnhancedPrintDialog(htmlContent, options) {
        const printWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
        if (printWindow) {
            printWindow.document.write(htmlContent);
            printWindow.document.close();
            
            // Enhanced print dialog with better timing and error handling
            printWindow.onload = () => {
                setTimeout(() => {
                    try {
                        printWindow.focus();
                        printWindow.print();
                        
                        // Show success message
                        this.showSuccessMessage('PDF print dialog opened! Use Ctrl+P or Cmd+P to print.');
                    } catch (error) {
                        console.error('Print dialog error:', error);
                        this.showError('Could not open print dialog. Please try again.');
                    }
                }, 1500);
            };
            
            // Fallback for older browsers
            setTimeout(() => {
                if (printWindow.document.readyState === 'complete') {
                    printWindow.focus();
                    printWindow.print();
                }
            }, 2000);
        } else {
            this.showError('Could not open print window. Please allow popups for this site.');
        }
    }
    
    // Keep the simpler print dialog as backup
    openPrintDialog(htmlContent) {
        const frame = document.createElement('iframe');
        frame.style.position = 'fixed';
        frame.style.right = '0';
        frame.style.bottom = '0';
        frame.style.width = '0';
        frame.style.height = '0';
        frame.style.border = 'none';
        document.body.appendChild(frame);

        frame.onload = () => {
            frame.contentWindow.focus();
            frame.contentWindow.print();
            setTimeout(() => frame.remove(), 1000);
        };

        frame.srcdoc = htmlContent;
    }
    
    enhanceHtmlForPdf(htmlContent) {
        // Add PDF-friendly styling
        const pdfStyles = `
            <style>
                @media print {
                    body { margin: 0; padding: 20px; }
                    @page { 
                        size: ${this.getCurrentPageSize()}; 
                        margin: 0.5in; 
                    }
                    .slide { 
                        page-break-after: always; 
                        min-height: 100vh; 
                    }
                    .slide:last-child { 
                        page-break-after: avoid; 
                    }
                }
            </style>
        `;
        
        // Insert styles into head
        return htmlContent.replace('</head>', pdfStyles + '</head>');
    }
    
    generatePrintStyles(options) {
        const pageSize = this.getPageSize(options.format);
        const marginSize = options.margin || 0.5;
        
        return `
            @media print {
                * {
                    -webkit-print-color-adjust: exact !important;
                    color-adjust: exact !important;
                }
                
                body {
                    margin: 0 !important;
                    padding: 0 !important;
                    background: white !important;
                    font-size: ${options.scale * 12}px !important;
                }
                
                @page {
                    size: ${pageSize};
                    margin: ${marginSize}in;
                }
                
                .slide, section, .swiper-slide, .page, .step {
                    page-break-after: always !important;
                    page-break-inside: avoid !important;
                    width: 100% !important;
                    height: ${this.getSlideHeight(options.format)} !important;
                    box-sizing: border-box !important;
                    overflow: hidden !important;
                    display: flex !important;
                    flex-direction: column !important;
                    position: relative !important;
                }
                
                .slide:last-child, section:last-child, .swiper-slide:last-child, .page:last-child, .step:last-child {
                    page-break-after: avoid !important;
                }
                
                /* Hide navigation and controls */
                .nav-dots, .navigation, .slide-nav, .controls, .indicator-dot {
                    display: none !important;
                }
                
                /* Ensure images and media print correctly */
                img, canvas, svg {
                    max-width: 100% !important;
                    height: auto !important;
                    page-break-inside: avoid !important;
                }
                
                /* Typography adjustments for print */
                h1, h2, h3, h4, h5, h6 {
                    page-break-after: avoid !important;
                }
                
                p, li {
                    orphans: 3 !important;
                    widows: 3 !important;
                }
            }
        `;
    }
    
    getPageSize(format) {
        switch(format) {
            case 'portrait': return 'letter portrait';
            case 'vertical': return 'A4 portrait';
            case 'horizontal': return 'A4 landscape';
            case 'classic': return 'letter landscape';
            default: return 'letter';
        }
    }
    
    getSlideHeight(format) {
        switch(format) {
            case 'portrait': return 'calc(11in - 1in)';
            case 'vertical': return 'calc(297mm - 25mm)';
            case 'horizontal': return 'calc(210mm - 25mm)';
            default: return 'calc(100vh - 1in)';
        }
    }
    
    async tryMultiplePdfMethods(htmlContent) {
        // If we have multiple slides, use them instead
        if (this.slides.length > 1) {
            return await this.printMultipleSlides();
        }
        
        // Method 1: Direct window print
        try {
            const tempWindow = window.open('', '_blank', 'width=1200,height=800');
            if (tempWindow) {
                tempWindow.document.write(htmlContent);
                tempWindow.document.close();
                
                // Wait for load
                await new Promise(resolve => {
                    tempWindow.addEventListener('load', resolve);
                    setTimeout(resolve, 2000);
                });
                
                tempWindow.print();
                return true;
            }
        } catch (error) {
            console.log('Method 1 failed:', error);
        }
        
        // Method 2: Blob URL approach
        try {
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const tempWindow = window.open(url, '_blank');
            if (tempWindow) {
                setTimeout(() => {
                    tempWindow.print();
                    URL.revokeObjectURL(url);
                }, 2000);
                return true;
            }
        } catch (error) {
            console.log('Method 2 failed:', error);
        }
        
        // Method 3: Data URL approach
        try {
            const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent);
            const tempWindow = window.open(dataUrl, '_blank');
            if (tempWindow) {
                setTimeout(() => tempWindow.print(), 2000);
                return true;
            }
        } catch (error) {
            console.log('Method 3 failed:', error);
        }
        
        return false; // All methods failed
    }
    
    async printMultipleSlides() {
        try {
            // Create a combined document with all slides
            const combinedHtml = this.createCombinedPdfDocument();
            
            const tempWindow = window.open('', '_blank', 'width=1200,height=800');
            if (tempWindow) {
                tempWindow.document.write(combinedHtml);
                tempWindow.document.close();
                
                // Wait for load
                await new Promise(resolve => {
                    tempWindow.addEventListener('load', resolve);
                    setTimeout(resolve, 3000); // Extra time for multiple slides
                });
                
                tempWindow.print();
                return true;
            }
        } catch (error) {
            console.log('Multiple slides print failed:', error);
        }
        
        return false;
    }
    
    async createEnhancedPdfDocument(options) {
        // Get original HTML content
        const originalHtml = await this.getFileContent(this.currentFile);
        const parser = new DOMParser();
        const doc = parser.parseFromString(originalHtml, 'text/html');
        
        // Remove any existing preview styles
        const existingStyles = doc.querySelectorAll('style');
        existingStyles.forEach(style => {
            if (style.textContent.includes('Enhanced Preview Styles')) {
                style.remove();
            }
        });
        
        // Ensure all slides are visible for printing
        const allSlides = doc.querySelectorAll('.slide, section, .swiper-slide, .page, .step');
        allSlides.forEach(slide => {
            slide.style.display = '';
            slide.style.visibility = 'visible';
            slide.classList.add('active');
        });
        
        // Add comprehensive print styles
        const printStyle = doc.createElement('style');
        printStyle.textContent = this.generatePrintStyles(options);
        doc.head.appendChild(printStyle);
        
        // Remove navigation elements
        const navElements = doc.querySelectorAll('.nav-dots, .navigation, .slide-nav, .controls');
        navElements.forEach(nav => nav.remove());
        
        return `<!DOCTYPE html>${doc.documentElement.outerHTML}`;
    }
    
    getConversionOptions() {
        return {
            format: document.getElementById('format').value,
            quality: document.getElementById('quality').value,
            margin: parseInt(document.getElementById('margin').value),
            scale: parseFloat(document.getElementById('scale').value)
        };
    }

    async getFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }

    showSuccessMessage(message) {
        const notification = document.createElement('div');
        notification.className = 'success-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 5000);
    }

    async convertToPDF() {
        // Use the direct download approach
        await this.directDownload();
    }

    async simulateConversion() {
        // Simulate conversion time
        return new Promise(resolve => setTimeout(resolve, 2000));
    }

    showDownloadInstructions(options) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Conversion Complete!</h2>
                <p>To complete the conversion, you have two options:</p>
                
                <div class="option-box">
                    <h3>Option 1: Use the CLI Tool</h3>
                    <ol>
                        <li>Install the CLI tool:
                            <code>npm install -g claude-html-to-pdf</code>
                        </li>
                        <li>Save your HTML file locally</li>
                        <li>Run the conversion:
                            <code>claude-pdf convert ${this.currentFile.name} --format ${options.format}</code>
                        </li>
                    </ol>
                </div>
                
                <div class="option-box">
                    <h3>Option 2: Use the Desktop App</h3>
                    <p>Download our desktop application for Windows, Mac, or Linux:</p>
                    <div class="download-buttons">
                        <a href="#" class="download-btn">Download for Windows</a>
                        <a href="#" class="download-btn">Download for Mac</a>
                        <a href="#" class="download-btn">Download for Linux</a>
                    </div>
                </div>
                
                <button class="close-btn" onclick="this.parentElement.parentElement.remove()">Close</button>
            </div>
        `;
        
        // Add modal styles
        const style = document.createElement('style');
        style.textContent = `
            .modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
            }
            
            .modal-content {
                background: white;
                padding: 40px;
                border-radius: 16px;
                max-width: 600px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
            }
            
            .modal-content h2 {
                margin-bottom: 20px;
            }
            
            .option-box {
                background: #f5f5f5;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
            }
            
            .option-box h3 {
                margin-bottom: 12px;
            }
            
            .option-box code {
                background: #e0e0e0;
                padding: 4px 8px;
                border-radius: 4px;
                font-family: monospace;
            }
            
            .download-buttons {
                display: flex;
                gap: 12px;
                margin-top: 16px;
            }
            
            .download-btn {
                padding: 8px 16px;
                background: #6B5B4F;
                color: white;
                text-decoration: none;
                border-radius: 8px;
                font-size: 14px;
            }
            
            .close-btn {
                margin-top: 20px;
                padding: 12px 24px;
                background: #6B5B4F;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 16px;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(modal);
    }

    showError(message) {
        // Create error notification
        const notification = document.createElement('div');
        notification.className = 'error-notification';
        notification.textContent = message;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .error-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #ff4444;
                color: white;
                padding: 16px 24px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                animation: slideIn 0.3s ease-out;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => notification.remove(), 3000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HTMLToPDFConverter();
});