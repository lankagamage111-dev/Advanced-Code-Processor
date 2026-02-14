// ආරක්ෂාව: මෙම කේතය iframe එකක් තුළ ක්‍රියාත්මක වන බවට වග බලා ගනී
if (window.self === window.top) {
    document.body.innerHTML = 'This tool is meant to be run inside the main application.';
}

class AutoSplitter {
    constructor() {
        // වෙන් කරගත් processed code තබා ගැනීමට
        this.processed = {
            html: '',
            css: '',
            js: ''
        };
        
        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        this.elements = {
            // Input
            mixedInput: document.getElementById('mixedInput'),
            pasteBtn: document.getElementById('pasteBtn'),
            processBtn: document.getElementById('processSplitBtn'),
            
            // Output
            outputSection: document.getElementById('outputSection'),
            errorDisplay: document.getElementById('splitterError'),
            
            // Download Buttons
            downloadHtmlBtn: document.getElementById('downloadHtmlBtn'),
            downloadCssBtn: document.getElementById('downloadCssBtn'),
            downloadJsBtn: document.getElementById('downloadJsBtn'),
            
            // Info Spans
            htmlInfo: document.getElementById('htmlInfo'),
            cssInfo: document.getElementById('cssInfo'),
            jsInfo: document.getElementById('jsInfo'),
        };
    }

    attachEventListeners() {
        this.elements.pasteBtn.addEventListener('click', () => this.pasteFromClipboard());
        this.elements.processBtn.addEventListener('click', () => this.process());
        
        // Download Listeners
        this.elements.downloadHtmlBtn.addEventListener('click', () => this.download('html'));
        this.elements.downloadCssBtn.addEventListener('click', () => this.download('css'));
        this.elements.downloadJsBtn.addEventListener('click', () => this.download('js'));
    }

    async pasteFromClipboard() {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                this.elements.mixedInput.value = text;
                this.showButtonSuccess(this.elements.pasteBtn, 'Pasted!');
            } else {
                this.showError('Clipboard is empty.');
            }
        } catch (error) {
            this.showError('Failed to read clipboard. Browser permission may be required.');
        }
    }

    process() {
        this.hideError();
        this.elements.outputSection.classList.remove('show');
        
        const input = this.elements.mixedInput.value;
        if (!input) {
            this.showError('Please paste your HTML code first.');
            return;
        }

        this.setLoadingState(true);

        try {
            // --- The Magic Happens Here (Regex) ---

            // 1. Extract CSS
            const cssRegex = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
            let cssContent = '';
            let processedInput = input.replace(cssRegex, (match, cssCode) => {
                cssContent += cssCode + '\n'; // සියලුම CSS එකතු කිරීම
                return ''; // HTML එකෙන් <style> tag එක ඉවත් කිරීම
            });

            // 2. Extract JS
            const jsRegex = /<script\b(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi;
            let jsContent = '';
            processedInput = processedInput.replace(jsRegex, (match, jsCode) => {
                jsContent += jsCode + '\n'; // සියලුම JS එකතු කිරීම
                return ''; // HTML එකෙන් <script> tag එක ඉවත් කිරීම
            });

            // 3. Process the extracted parts
            const htmlOriginal = processedInput; // HTML (CSS/JS tags ඉවත් කළ පසු)
            
            this.processed.html = this.minifyHTML(htmlOriginal);
            this.processed.css = this.minifyCSS(cssContent);
            this.processed.js = this.obfuscateJavaScript(jsContent);

            // 4. Update stats
            this.updateStats('html', htmlOriginal.length, this.processed.html.length);
            this.updateStats('css', cssContent.length, this.processed.css.length);
            this.updateStats('js', jsContent.length, this.processed.js.length);

            // 5. Show output
            this.elements.outputSection.classList.add('show');

        } catch (error) {
            this.showError(`Processing Failed: ${error.message}`);
        } finally {
            this.setLoadingState(false);
        }
    }

    // ===================================================
    // PROCESSING FUNCTIONS (ප්‍රධාන ඇප් එකෙන්ම උපුටා ගන්නා ලදී)
    // ===================================================

   minifyHTML(code) {
               try {
                    let minified = code.replace(/<!--[\s\S]*?-->/g, '');
                   minified = minified.replace(/\s+/g, ' '); // Collapse whitespace
                    minified = minified.replace(/>\s+</g, '><');
                    return minified.trim();
               } catch (error) {
                   throw new Error('HTML minification failed: ' + error.message);
               }
           }

    minifyCSS(code) {
        if (!code.trim()) return '';
        try {
            return code
                .replace(/\/\*[\s\S]*?\*\//g, '')
                .replace(/\s+/g, ' ')
                .replace(/;\s*}/g, ';}')
                .replace(/{\s*/g, '{')
                .replace(/}\s*/g, '}')
                .replace(/,\s*/g, ',')
                .replace(/:\s*/g, ':')
                .replace(/;\s*/g, ';')
                .trim();
        } catch (error) {
            throw new Error('CSS minification failed: ' + error.message);
        }
    }

    obfuscateJavaScript(code) {
        if (!code.trim()) return '';
        if (typeof JavaScriptObfuscator === 'undefined') {
            throw new Error('Obfuscator library failed to load.');
        }
        try {
            const obfuscationResult = JavaScriptObfuscator.obfuscate(code, {
                compact: true,
                controlFlowFlattening: true,
                deadCodeInjection: true,
                stringArray: true,
                stringArrayEncoding: ['base64'],
                selfDefending: true
            });
            return obfuscationResult.getObfuscatedCode();
        } catch (error) {
            throw new Error('JS Obfuscation Failed: ' + error.message);
        }
    }
    
    // ===================================================
    // HELPER FUNCTIONS
    // ===================================================

    download(type) {
        const content = this.processed[type];
        if (content === undefined) return;

        let filename = 'download.txt';
        let mimeType = 'text/plain';

        if (type === 'html') {
            filename = 'index.html';
            mimeType = 'text/html';
        } else if (type === 'css') {
            filename = 'style.css';
            mimeType = 'text/css';
        } else if (type === 'js') {
            filename = 'script.js';
            mimeType = 'text/javascript';
        }

        const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }

    updateStats(type, originalSize, processedSize) {
        const originalKB = this.formatBytes(originalSize);
        let processedLabel = 'Processed';
        
        if (type === 'html' || type === 'css') processedLabel = 'Minified';
        if (type === 'js') processedLabel = 'Obfuscated';

        const infoText = `Original: ${originalKB} | ${processedLabel}: ${this.formatBytes(processedSize)}`;
        
        if (type === 'html') this.elements.htmlInfo.textContent = infoText;
        if (type === 'css') this.elements.cssInfo.textContent = infoText;
        if (type === 'js') this.elements.jsInfo.textContent = infoText;
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 bytes';
        const k = 1024;
        const sizes = ['bytes', 'KB', 'MB', 'GB']; // <-- 'MB' ලෙස නිවැරදි කරන ලදී
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    setLoadingState(isLoading) {
        this.elements.processBtn.disabled = isLoading;
        if (isLoading) {
            this.elements.processBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processing...`;
        } else {
            this.elements.processBtn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> Analyze & Split`;
        }
    }

    showButtonSuccess(button, message) {
        const originalHTML = button.innerHTML;
        button.innerHTML = `<i class="fa-solid fa-check"></i> ${message}`;
        button.disabled = true;
        
        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.disabled = false;
        }, 2000);
    }

    showError(message) {
        this.elements.errorDisplay.textContent = message;
        this.elements.errorDisplay.classList.add('show');
    }

    hideError() {
        this.elements.errorDisplay.classList.remove('show');
    }
}

// Initialize the splitter app
const splitter = new AutoSplitter();