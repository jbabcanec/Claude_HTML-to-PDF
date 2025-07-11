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
        
        // Analyze slide structure
        const slideInfo = this.detectSlideStructure(htmlContent);
        
        if (slideInfo.isHorizontalScroll && slideInfo.slideCount > 1) {
            // Extract actual slides
            await this.prepareSlides(htmlContent, slideInfo);
            this.showSlideNavigation();
        } else {
            // Show single page
            this.slides = [{ content: htmlContent, title: 'Full Document' }];
            this.hideSlideNavigation();
        }
        
        // Show the actual HTML content
        this.showCurrentSlide();
    }
    
    async prepareSlides(htmlContent, slideInfo) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        
        // Find all slide elements
        const slideElements = doc.querySelectorAll('.slide');
        
        this.slides = [];
        slideElements.forEach((slide, index) => {
            // Create a clean copy of the original HTML with just this slide
            const slideHtml = this.createCleanSlideHtml(htmlContent, slide, index);
            this.slides.push({
                content: slideHtml,
                title: `Slide ${index + 1}`
            });
        });
        
        console.log(`📄 Prepared ${this.slides.length} slides for preview`);
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
    
    createCleanSlideHtml(originalHtml, slideElement, index) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(originalHtml, 'text/html');
        
        // Hide all slides except the current one
        const allSlides = doc.querySelectorAll('.slide');
        allSlides.forEach((slide, i) => {
            if (i !== index) {
                slide.style.display = 'none';
            }
        });
        
        // Add a simple override to show only this slide
        const style = doc.createElement('style');
        style.textContent = `
            .slide:nth-child(${index + 1}) {
                display: flex !important;
            }
        `;
        doc.head.appendChild(style);
        
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
            // Apply current zoom after loading
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
        // Reset to 100% zoom for fit to window
        this.currentZoom = 1.0;
        this.applyZoom();
        this.updateZoomDisplay();
    }
    
    applyZoom() {
        // Apply zoom to the iframe content
        this.previewFrame.style.transform = `scale(${this.currentZoom})`;
        this.previewFrame.style.transformOrigin = 'top left';
        
        // Adjust the container to accommodate the scaled content
        const scaledWidth = this.previewFrame.offsetWidth * this.currentZoom;
        const scaledHeight = this.previewFrame.offsetHeight * this.currentZoom;
        
        this.previewContent.style.minWidth = `${scaledWidth}px`;
        this.previewContent.style.minHeight = `${scaledHeight}px`;
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

    detectSlideStructure(htmlContent) {
        const info = {
            type: 'single-page',
            slideCount: 1,
            method: 'none',
            isHorizontalScroll: false,
            suggestions: []
        };
        
        // First, check for .slide elements specifically
        const slideElements = htmlContent.match(/<div[^>]*class="[^"]*slide[^"]*"/gi);
        
        if (slideElements && slideElements.length > 0) {
            info.slideCount = slideElements.length;
            info.type = 'slide-based';
            info.method = '.slide';
            info.suggestions.push(`Found ${slideElements.length} slides`);
            
            // Now check if it's also a horizontal scroll presentation
            if (this.isHorizontalScrollPresentation(htmlContent)) {
                info.isHorizontalScroll = true;
                info.type = 'horizontal-scroll';
                info.method = 'horizontal-scroll';
                info.suggestions.push('Horizontal scroll presentation detected');
            }
        }
        
        return info;
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

    async directDownload() {
        if (!this.currentFile) {
            this.showError('No file selected');
            return;
        }

        const convertBtn = document.getElementById('convertBtn');
        convertBtn.textContent = '⏳ Generating PDF...';
        convertBtn.disabled = true;

        try {
            // If we have multiple slides, create a combined PDF document
            if (this.slides.length > 1) {
                const combinedHtml = this.createCombinedPdfDocument();
                this.openPrintDialog(combinedHtml);
            } else {
                // Single page - just print the current content
                const htmlContent = await this.getFileContent(this.currentFile);
                const enhancedHtml = this.enhanceHtmlForPdf(htmlContent);
                this.openPrintDialog(enhancedHtml);
            }
            
        } catch (error) {
            console.error('Direct download failed:', error);
            this.showError('PDF generation failed. Please try again.');
        } finally {
            convertBtn.textContent = '📄 Download PDF';
            convertBtn.disabled = false;
        }
    }
    
    openPrintDialog(htmlContent) {
        const printWindow = window.open('', '_blank', 'width=1200,height=800');
        if (printWindow) {
            printWindow.document.write(htmlContent);
            printWindow.document.close();
            
            // Wait for content to load then open print dialog
            setTimeout(() => {
                printWindow.focus();
                printWindow.print();
            }, 1000);
        }
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
    
    getCurrentPageSize() {
        const format = document.getElementById('format').value;
        switch(format) {
            case 'portrait': return 'letter portrait';
            case 'vertical': return 'A4 portrait';
            case 'horizontal': return 'A4 landscape';
            default: return 'letter';
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
    
    createCombinedPdfDocument() {
        // Take the original HTML from the first slide and extract all slides
        const parser = new DOMParser();
        const doc = parser.parseFromString(this.slides[0].content, 'text/html');
        
        // Remove any hiding styles we added
        const injectedStyles = doc.querySelectorAll('style');
        injectedStyles.forEach(style => {
            if (style.textContent.includes('nth-child')) {
                style.remove();
            }
        });
        
        // Make all slides visible for printing
        const allSlides = doc.querySelectorAll('.slide');
        allSlides.forEach(slide => {
            slide.style.display = '';
        });
        
        // Add print-specific styles
        const printStyle = doc.createElement('style');
        printStyle.textContent = `
            @media print {
                body { 
                    margin: 0; 
                    padding: 0; 
                    background: white; 
                }
                @page { 
                    size: ${this.getCurrentPageSize()}; 
                    margin: 0.5in; 
                }
                .slide { 
                    page-break-after: always; 
                    min-height: 100vh;
                    width: 100%;
                    box-sizing: border-box;
                    overflow: hidden;
                }
                .slide:last-child { 
                    page-break-after: avoid; 
                }
            }
        `;
        doc.head.appendChild(printStyle);
        
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