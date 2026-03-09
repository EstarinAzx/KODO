"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePackManifest = validatePackManifest;
/**
 * Validate a pack manifest's structure and content.
 * Returns null if valid, or an error message string.
 */
function validatePackManifest(data) {
    // Required string fields
    const requiredStrings = ['name', 'description', 'author', 'language', 'icon', 'version'];
    for (const field of requiredStrings) {
        if (typeof data[field] !== 'string' || data[field].length === 0) {
            return `Missing or invalid field: ${field}`;
        }
    }
    // Name length limits
    if (data.name.length > 100) {
        return 'Pack name must be 100 characters or fewer';
    }
    // Description length limits
    if (data.description.length > 500) {
        return 'Description must be 500 characters or fewer';
    }
    // Snippets array
    if (!Array.isArray(data.snippets) || data.snippets.length === 0) {
        return 'Pack must contain at least one snippet';
    }
    if (data.snippets.length > 50) {
        return 'Pack cannot contain more than 50 snippets';
    }
    // Validate each snippet has required fields
    for (const snippet of data.snippets) {
        if (!snippet || typeof snippet !== 'object') {
            return 'Invalid snippet entry';
        }
        if (!snippet.name || !snippet.code || !snippet.language) {
            return 'Each snippet must have name, code, and language fields';
        }
    }
    // Folders array
    if (!Array.isArray(data.folders)) {
        return 'Missing folders array';
    }
    // Tags array
    if (!Array.isArray(data.tags)) {
        return 'Missing tags array';
    }
    // Size check — manifest JSON shouldn't exceed 500KB
    const jsonSize = JSON.stringify(data).length;
    if (jsonSize > 500 * 1024) {
        return 'Pack manifest exceeds 500KB size limit';
    }
    return null; // Valid
}
//# sourceMappingURL=validatePack.js.map