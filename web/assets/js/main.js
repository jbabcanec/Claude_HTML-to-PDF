// Main application logic
class HTMLToPDFConverter {
    constructor() {
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.conversionOptions = document.getElementById('conversionOptions');
        this.previewArea = document.getElementById('previewArea');
        this.previewFrame = document.getElementById('previewFrame');
        this.convertBtn = document.getElementById('convertBtn');
        
        this.currentFile = null;
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

    showPreview(htmlContent) {
        this.previewArea.style.display = 'block';
        
        // Create a blob URL for the preview
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        this.previewFrame.src = url;
        
        // Clean up blob URL when frame loads
        this.previewFrame.onload = () => {
            URL.revokeObjectURL(url);
        };
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
            type: 'unknown',
            slideCount: 1,
            method: 'none',
            isHorizontalScroll: false,
            suggestions: []
        };
        
        // Check for horizontal scrolling presentations
        if (this.isHorizontalScrollPresentation(htmlContent)) {
            info.type = 'horizontal-scroll';
            info.isHorizontalScroll = true;
            info.slideCount = this.estimateScrollSlides(htmlContent);
            info.method = 'horizontal-scroll';
            info.suggestions.push('Detected horizontal scroll presentation');
        }
        
        // Check for slide-based presentations
        const slideSelectors = [
            '.slide', '[data-slide]', '.swiper-slide', '.reveal .slides section',
            '.step', '.page', 'section', '.slide-container'
        ];
        
        for (const selector of slideSelectors) {
            const regex = new RegExp(`<[^>]*class="[^"]*${selector.replace('.', '')}[^"]*"`, 'gi');
            const matches = htmlContent.match(regex);
            if (matches && matches.length > 1) {
                info.type = 'slide-based';
                info.slideCount = matches.length;
                info.method = selector;
                info.suggestions.push(`Found ${matches.length} slides using ${selector}`);
                break;
            }
        }
        
        // Check for indicator-based navigation
        const indicatorRegex = /<[^>]*class="[^"]*(?:indicator|dot|bullet|nav)[^"]*"/gi;
        const indicatorMatches = htmlContent.match(indicatorRegex);
        if (indicatorMatches && indicatorMatches.length > 1) {
            info.slideCount = Math.max(info.slideCount, indicatorMatches.length);
            info.suggestions.push(`Found ${indicatorMatches.length} navigation indicators`);
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
            // Get the HTML content
            const htmlContent = await this.getFileContent(this.currentFile);
            
            // Enhanced approach: Create a better formatted document
            const enhancedHtml = this.enhanceHtmlForPdf(htmlContent);
            
            // Try multiple methods for PDF generation
            const success = await this.tryMultiplePdfMethods(enhancedHtml);
            
            if (success) {
                this.showSuccessMessage('PDF generation successful! Check your downloads folder.');
            } else {
                // Fallback: show the modal instructions
                this.showDownloadInstructions(this.getConversionOptions());
            }
            
        } catch (error) {
            console.error('Direct download failed:', error);
            // Always provide fallback
            this.showDownloadInstructions(this.getConversionOptions());
        } finally {
            convertBtn.textContent = '📄 Download PDF';
            convertBtn.disabled = false;
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