import { getGeminiModel } from '../config/gemini.js';
import axios from 'axios';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { logger } from '../utils/logger.js';

/**
 * Summarizes an academic resource using Google Gemini API.
 * Extracts text from PDFs directly via S3 fileUrl, truncates, and summarizes.
 * Falls back to metadata-only for non-PDFs or scanned images without text layers.
 */
export const summarizeResource = async (title, courseCode, tags, fileUrl) => {
  try {
    const model = getGeminiModel();
    let prompt = '';

    // Check if the uploaded file is a PDF based on the URL extension
    const isPdf = fileUrl && fileUrl.toLowerCase().split('?')[0].endsWith('.pdf');
    let extractedText = '';

    if (isPdf) {
      try {
        const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
        const pdfData = await pdfParse(response.data);
        
        extractedText = pdfData.text || '';
        extractedText = extractedText.trim();
      } catch (pdfErr) {
        logger.warn('PDF extraction failed, falling back to metadata:', pdfErr.message);
      }
    }

    if (extractedText.length > 50) {
      // Truncate to save context window and cost, first ~5000 chars is plenty for a summary
      const truncatedText = extractedText.substring(0, 5000);
      prompt = `Here is the extracted content from a student's study resource titled "${title}" for course "${courseCode}". Summarize in 2-3 sentences what topics/concepts this material actually covers, based on the content below, not just the title:\n\n${truncatedText}`;
    } else {
      // Graceful fallback for non-PDFs or scanned PDFs with no text layer
      logger.warn(`Falling back to metadata-only summary for: ${title}`);
      prompt = `You are an academic assistant. Please write a 2-3 sentence summary explaining what a student can expect from a study resource with the following details. Keep it professional, concise, and helpful. Note: This summary is based only on metadata, not file content.
      
      Title: ${title}
      Course Code: ${courseCode}
      Tags: ${tags.join(', ')}
      `;
    }

    const result = await model.generateContent(prompt);
    const apiResponse = await result.response;
    let summaryText = apiResponse.text();
    
    // Explicitly note when a summary is metadata-only
    if (!(extractedText.length > 50)) {
      summaryText = `(Metadata Fallback) ${summaryText}`;
    }

    return summaryText;
  } catch (err) {
    logger.warn('Error generating AI summary:', err.message);
    
    if (err.message.includes('GEMINI_API_KEY is missing')) {
      logger.warn('Gemini summarization skipped: API Key is not configured.');
    } else if (err.status === 429) {
      logger.warn('Gemini summarization skipped: Rate limit / Quota exceeded.');
    } else if (err.name === 'FetchError' || err.code === 'ETIMEDOUT') {
      logger.warn('Gemini summarization skipped: Network timeout.');
    }
    
    return ''; // Graceful fallback
  }
};
