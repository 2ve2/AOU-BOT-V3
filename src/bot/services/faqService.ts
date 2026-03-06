import { promises as fs } from 'fs';
import * as path from 'path';
import type { FAQCreateInput, FAQ } from '@/types/schemas';

const FAQ_FILE_PATH = path.join(process.cwd(), 'src/data/faqs.json');

interface FAQData {
  faqs: FAQ[];
}

/**
 * Read FAQs from JSON file
 */
async function readFAQsFile(): Promise<FAQData> {
  try {
    const data = await fs.readFile(FAQ_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return empty structure
    return { faqs: [] };
  }
}

/**
 * Write FAQs to JSON file
 */
async function writeFAQsFile(data: FAQData): Promise<void> {
  await fs.writeFile(FAQ_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export const faqService = {
  /**
   * CREATE A NEW FAQ
   */
  async createFAQ(data: FAQCreateInput): Promise<FAQ> {
    const faqData = await readFAQsFile();
    
    const newFAQ: FAQ = {
      id: Date.now(), // Generate unique ID based on timestamp
      question: data.question,
      answer: data.answer,
    };
    
    faqData.faqs.push(newFAQ);
    await writeFAQsFile(faqData);
    
    return newFAQ;
  },

  /**
   * GET ALL FAQs
   */
  async getAllFAQs(): Promise<FAQ[]> {
    const faqData = await readFAQsFile();
    return faqData.faqs;
  },

  /**
   * DELETE FAQ BY ID
   */
  async deleteFAQ(id: number): Promise<boolean> {
    const faqData = await readFAQsFile();
    
    const initialLength = faqData.faqs.length;
    faqData.faqs = faqData.faqs.filter(faq => faq.id !== id);
    
    if (faqData.faqs.length === initialLength) {
      return false; // FAQ not found
    }
    
    await writeFAQsFile(faqData);
    return true;
  },

  /**
   * GET FAQ BY ID
   */
  async getFAQById(id: number): Promise<FAQ | undefined> {
    const faqData = await readFAQsFile();
    return faqData.faqs.find(faq => faq.id === id);
  },

  /**
   * GET FAQ BY QUESTION NAME
   */
  async getFAQByQuestion(question: string, lang: "ar" | "en"): Promise<FAQ | undefined> {
    const faqData = await readFAQsFile();
    return faqData.faqs.find(faq => faq.question[lang] === question);
  },

  /**
   * GET ALL FAQ QUESTION NAMES
   */
  async getFAQQuestionNames(lang: "ar" | "en"): Promise<string[]> {
    const faqData = await readFAQsFile();
    return faqData.faqs.map(faq => faq.question[lang]);
  },

  /**
   * UPDATE FAQ BY ID
   */
  async updateFAQ(id: number, data: Partial<FAQCreateInput>): Promise<FAQ | null> {
    const faqData = await readFAQsFile();
    const faqIndex = faqData.faqs.findIndex(faq => faq.id === id);
    
    if (faqIndex === -1) {
      return null; // FAQ not found
    }
    
    // Update the FAQ
    if (data.question) {
      faqData.faqs[faqIndex]!.question = data.question;
    }
    if (data.answer) {
      faqData.faqs[faqIndex]!.answer = data.answer;
    }
    
    await writeFAQsFile(faqData);
    return faqData.faqs[faqIndex]!;
  },
};
