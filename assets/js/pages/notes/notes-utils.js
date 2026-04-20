
// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showError(message) {
    const content = document.getElementById('content');
    content.innerHTML = `<div class="error">${message}</div>`;
}

function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
}

function formatFileSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}

function getMaterialFileUrl(filePath) {
    if (!filePath) return '#';
    if (/^https?:\/\//i.test(filePath)) return filePath;
    if (filePath.startsWith('/')) return window.location.origin + filePath;
    return filePath;
}

function getAbsoluteUrl(url) {
    try {
        return new URL(url, window.location.href).href;
    } catch (error) {
        return window.location.href;
    }
}

function getFileExtension(filePath, fallbackType) {
    const cleanPath = (filePath || '').split('?')[0].split('#')[0];
    const extensionMatch = cleanPath.match(/\.([a-z0-9]+)$/i);
    return (extensionMatch ? extensionMatch[1] : fallbackType || 'pdf').toLowerCase();
}

function getSafeDownloadFileName(material) {
    const extension = getFileExtension(material.path, material.type);
    const safeTitle = (material.title || 'college-daddy-notes')
        .replace(/[^a-z0-9]/gi, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
        .toLowerCase();

    return `${safeTitle || 'college-daddy-notes'}.${extension}`;
}

function getShareText(material, contextText) {
    const title = material.title || 'College Daddy notes';
    const description = material.description ? ` - ${material.description}` : '';
    const context = contextText ? `\n${contextText}` : '';
    return `${title}${description}${context}`;
}

function getPdfPreviewUrl(fileUrl) {
    const absoluteUrl = getAbsoluteUrl(fileUrl);
    return absoluteUrl.includes('#')
        ? absoluteUrl
        : `${absoluteUrl}#toolbar=0&navpanes=0&view=FitH`;
}

function createPdfPreviewHTML(material, fileUrl) {
    if (getFileExtension(material.path, material.type) !== 'pdf') {
        return '';
    }

    const previewUrl = sanitizeHTML(getPdfPreviewUrl(fileUrl));
    const title = sanitizeHTML(material.title || 'PDF notes');

    return `
        <div class="pdf-hover-preview" aria-label="PDF preview for ${title}">
            <div class="pdf-preview-heading">
                <span>Quick preview</span>
            </div>
            <iframe
                class="pdf-preview-frame"
                title="Preview of ${title}"
                loading="lazy"
                data-src="${previewUrl}">
            </iframe>
        </div>
    `;
}

function createNoteActionsHTML(material, contextText = '') {
    const fileUrl = getMaterialFileUrl(material.path || '');
    const shareUrl = getAbsoluteUrl(fileUrl);
    const shareText = getShareText(material, contextText);
    const title = material.title || 'College Daddy notes';
    const safeFileName = getSafeDownloadFileName(material);
    const encodedTextWithUrl = encodeURIComponent(`${shareText}\n${shareUrl}`);
    const encodedShareUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(title);
    const encodedEmailBody = encodeURIComponent(`${shareText}\n\n${shareUrl}`);

    return `
        <a href="${sanitizeHTML(fileUrl)}"
           target="_blank"
           rel="noopener noreferrer"
           class="view-btn">
            View PDF
        </a>
        <a href="${sanitizeHTML(fileUrl)}"
           download="${sanitizeHTML(safeFileName)}"
           class="download-btn">
            Download
        </a>
        <button
            type="button"
            class="copy-link-btn"
            data-note-url="${sanitizeHTML(shareUrl)}"
            aria-label="Copy link for ${sanitizeHTML(title)}">
            Copy Link
        </button>
        <div
            class="note-share"
            data-share-title="${sanitizeHTML(title)}"
            data-share-text="${sanitizeHTML(shareText)}"
            data-share-url="${sanitizeHTML(shareUrl)}">
            <button
                type="button"
                class="share-note-btn"
                aria-expanded="false"
                aria-label="Share ${sanitizeHTML(title)}">
                Share
            </button>
            <div class="note-share-menu" hidden>
                <button type="button" class="note-share-option native-share-option">
                    Device Share
                </button>
                <a class="note-share-option"
                   href="https://wa.me/?text=${encodedTextWithUrl}"
                   target="_blank"
                   rel="noopener noreferrer">
                    WhatsApp
                </a>
                <a class="note-share-option"
                   href="https://t.me/share/url?url=${encodedShareUrl}&text=${encodeURIComponent(shareText)}"
                   target="_blank"
                   rel="noopener noreferrer">
                    Telegram
                </a>
                <a class="note-share-option"
                   href="mailto:?subject=${encodedTitle}&body=${encodedEmailBody}">
                    Email
                </a>
            </div>
        </div>
    `;
}

function setupMaterialCardInteractions(card) {
    const previewFrame = card.querySelector('.pdf-preview-frame');
    if (previewFrame) {
        const loadPreview = () => {
            if (!previewFrame.src) {
                previewFrame.src = previewFrame.dataset.src;
            }
        };

        card.classList.add('has-pdf-preview');
        card.addEventListener('mouseenter', loadPreview, { once: true });
        card.addEventListener('focusin', loadPreview, { once: true });
    }

    const copyButton = card.querySelector('.copy-link-btn');
    copyButton?.addEventListener('click', async (event) => {
        event.stopPropagation();
        await copyNoteLink(copyButton.dataset.noteUrl);
    });

    const share = card.querySelector('.note-share');
    const shareButton = share?.querySelector('.share-note-btn');
    const shareMenu = share?.querySelector('.note-share-menu');
    const nativeShareButton = share?.querySelector('.native-share-option');

    if (nativeShareButton && !navigator.share) {
        nativeShareButton.hidden = true;
    }

    shareButton?.addEventListener('click', (event) => {
        event.stopPropagation();
        const isOpen = !shareMenu.hidden;
        closeAllNoteShareMenus();
        shareMenu.hidden = isOpen;
        shareButton.setAttribute('aria-expanded', String(!isOpen));
        card.classList.toggle('share-menu-open', !isOpen);
    });

    shareMenu?.addEventListener('click', (event) => {
        event.stopPropagation();
    });

    nativeShareButton?.addEventListener('click', async () => {
        if (!navigator.share) return;

        try {
            await navigator.share({
                title: share.dataset.shareTitle,
                text: share.dataset.shareText,
                url: share.dataset.shareUrl
            });
            showNoteToast('Shared successfully!');
            closeAllNoteShareMenus();
        } catch (error) {
            if (error.name !== 'AbortError') {
                showNoteToast('Unable to share right now.');
            }
        }
    });

    ensureNoteShareGlobalListeners();
}

let noteShareGlobalListenersReady = false;

function ensureNoteShareGlobalListeners() {
    if (noteShareGlobalListenersReady) return;
    noteShareGlobalListenersReady = true;

    document.addEventListener('click', closeAllNoteShareMenus);
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeAllNoteShareMenus();
        }
    });
}

function closeAllNoteShareMenus() {
    document.querySelectorAll('.note-share-menu').forEach(menu => {
        menu.hidden = true;
    });

    document.querySelectorAll('.share-note-btn[aria-expanded="true"]').forEach(button => {
        button.setAttribute('aria-expanded', 'false');
    });

    document.querySelectorAll('.material-card.share-menu-open').forEach(card => {
        card.classList.remove('share-menu-open');
    });
}

async function copyNoteLink(url) {
    try {
        await navigator.clipboard.writeText(url);
        showNoteToast('Link copied to clipboard!');
    } catch (error) {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.setAttribute('readonly', '');
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();

        try {
            document.execCommand('copy');
            showNoteToast('Link copied to clipboard!');
        } catch (copyError) {
            showNoteToast('Could not copy the link.');
        }

        document.body.removeChild(textArea);
    }
}

function showNoteToast(message) {
    const existingToast = document.querySelector('.note-toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = 'note-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 250);
    }, 2500);
}

