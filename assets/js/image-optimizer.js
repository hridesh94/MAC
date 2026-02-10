/**
 * MAC Image Optimization Utility
 * Handles client-side resizing and compression to save storage and bandwidth.
 */

const IMAGE_CONFIG = {
    maxWidth: 1200,
    quality: 0.8,
    type: 'image/jpeg'
};

async function optimizeImage(file) {
    return new Promise((resolve, reject) => {
        // Only process images
        if (!file.type.startsWith('image/')) {
            return resolve(file);
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Only resize if larger than maxWidth
                if (width > IMAGE_CONFIG.maxWidth) {
                    height = (IMAGE_CONFIG.maxWidth / width) * height;
                    width = IMAGE_CONFIG.maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    // Create a new file from the blob
                    const optimizedFile = new File([blob], file.name, {
                        type: IMAGE_CONFIG.type,
                        lastModified: Date.now()
                    });
                    resolve(optimizedFile);
                }, IMAGE_CONFIG.type, IMAGE_CONFIG.quality);
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
}
