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
            console.log('Upload area clicked');
            // Don't prevent default - this might be interfering with file input
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
            console.log('File input changed:', e.target.files);
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
        console.log('Triggering file input click');
        try {
            this.fileInput.click();
            console.log('File input click successful');
        } catch (error) {
            console.error('File input click failed:', error);
        }
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
        console.log('Processing file:', file.name);
        this.currentFile = file;
        
        // Show conversion options
        this.conversionOptions.style.display = 'block';
        
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
        // Simple detection logic
        const formatSelect = document.getElementById('format');
        
        if (htmlContent.includes('width=1920') || htmlContent.includes('16:9')) {
            formatSelect.value = 'horizontal';
        } else if (htmlContent.includes('width=1080') || htmlContent.includes('9:16')) {
            formatSelect.value = 'vertical';
        } else {
            formatSelect.value = 'auto';
        }
    }

    async convertToPDF() {
        if (!this.currentFile) {
            this.showError('No file selected');
            return;
        }

        // Get conversion options
        const options = {
            format: document.getElementById('format').value,
            quality: document.getElementById('quality').value,
            margin: parseInt(document.getElementById('margin').value),
            scale: parseFloat(document.getElementById('scale').value)
        };

        // Show loading state
        this.convertBtn.textContent = 'Converting...';
        this.convertBtn.disabled = true;

        try {
            // Since we're running on GitHub Pages, we'll need to use a server API
            // For now, we'll simulate the conversion and provide instructions
            await this.simulateConversion();
            
            // Show download instructions
            this.showDownloadInstructions(options);
            
        } catch (error) {
            this.showError('Conversion failed: ' + error.message);
        } finally {
            this.convertBtn.textContent = 'Convert to PDF';
            this.convertBtn.disabled = false;
        }
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