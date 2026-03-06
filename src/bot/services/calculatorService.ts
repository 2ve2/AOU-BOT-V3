/**
 * AOU Academic Calculator Service
 * Calculates tuition fees based on selected courses and student nationality
 */

import coursePricesData from '../../data/coursePrices.json';

export interface Course {
  id: string;
  displayName?: string;
  price: string;
  package: string;
}

// Course prices data loaded from JSON
export const COURSE_PRICES = coursePricesData.courses;

export interface CourseDetail {
  id: string;
  price: number;
}

export interface CalculationResult {
  subTotal: number;
  subDetails: CourseDetail[];
  total: number;
  TSER: number;
  VAT: number;
}

export interface FixedFee {
  name: {
    en: string;
    ar: string;
  };
  price: number;
}

// Fixed fees (582 SAR total)
export const FIXED_FEES: FixedFee[] = [
  {
    name: {
      en: "Registration Fees",
      ar: "رسوم التسجيل"
    },
    price: 469
  },
  {
    name: {
      en: "Administrative Fees",
      ar: "رسوم إدارية"
    },
    price: 90
  },
  {
    name: {
      en: "Student Aid Support",
      ar: "دعم صندوق الطالب"
    },
    price: 23
  }
];

const BASE_TSER = 563; // Base Technical Services & Electronic Resources fee
const FIXED_FEES_TOTAL = 582; // Sum of all fixed fees
const VAT_RATE = 0.15; // 15% VAT for non-Saudi students

/**
 * Calculate tuition fees based on selected courses and student nationality
 * 
 * @param mode - "1" for Saudi students, "2" for non-Saudi students
 * @param selectedCourses - Array of selected course IDs
 * @param courses - Array of all available courses with pricing
 * @returns Calculation result with breakdown
 */
export function calculateFees(
  mode: string,
  selectedCourses: string[],
  courses: Course[]
): CalculationResult {
  let subTotal = 0;
  let TSER = BASE_TSER;
  let VAT = 0;
  const subDetails: CourseDetail[] = [];

  // Calculate course fees and TSER
  selectedCourses.forEach(courseId => {
    const course = courses.find(c => c.id === courseId);
    
    if (!course) {
      console.error(`Missing course price for ID: ${courseId}`);
      return;
    }

    subDetails.push({
      id: course.id,
      price: parseFloat(course.price)
    });

    subTotal += parseFloat(course.price);
    TSER += parseFloat(course.package);
  });

  // Calculate VAT for non-Saudi students
  if (mode === "2") {
    VAT = (subTotal + TSER + FIXED_FEES_TOTAL) * VAT_RATE;
  }

  return {
    subTotal,
    subDetails,
    total: subTotal + TSER + parseFloat(VAT.toFixed(2)) + FIXED_FEES_TOTAL,
    TSER,
    VAT: parseFloat(VAT.toFixed(2))
  };
}

/**
 * Format calculation result as a readable string
 *
 * @param result - Calculation result
 * @param selectedCourses - Array of selected course IDs
 * @param locale - "en" for English, "ar" for Arabic
 * @returns Formatted string with fee breakdown
 */
export function formatCalculationResult(
  result: CalculationResult,
  selectedCourses: string[],
  locale: "en" | "ar" = "en"
): string {
  const currency = locale === "en" ? "SAR" : "ريال";
  let text = "";

  if (locale === "en") {
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📚 <b>Selected Courses</b>\n`;
    selectedCourses.forEach(courseId => {
      const course = result.subDetails.find(d => d.id === courseId);
      if (course) {
        text += `   • ${course.id}\n`;
      }
    });
    text += `\n📚 <b>Courses Fees</b>\n`;
    text += `   ${result.subTotal} ${currency}\n\n`;
    
    text += `📋 <b>Fixed Fees</b>\n`;
    FIXED_FEES.forEach(fee => {
      text += `   • ${fee.name.en}: ${fee.price} ${currency}\n`;
    });
    
    text += `\n💻 <b>Technical Services & Electronic Resources</b>\n`;
    text += `   ${result.TSER} ${currency}\n\n`;
    
    if (result.VAT > 0) {
      text += `🧾 <b>VAT (15%)</b>\n`;
      text += `   ${result.VAT} ${currency}\n\n`;
    }
    
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `💰 <b>Total</b>: ${result.total} ${currency}`;
    text += `\n━━━━━━━━━━━━━━━━━━━━`;
  } else {
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📚 <b>المقررات المحددة</b>\n`;
    selectedCourses.forEach(courseId => {
      const course = result.subDetails.find(d => d.id === courseId);
      if (course) {
        text += `   • ${course.id}\n`;
      }
    });
    text += `\n📚 <b>رسوم المقررات</b>\n`;
    text += `   ${result.subTotal} ${currency}\n\n`;
    
    text += `📋 <b>الرسوم الثابتة</b>\n`;
    FIXED_FEES.forEach(fee => {
      text += `   • ${fee.name.ar}: ${fee.price} ${currency}\n`;
    });
    
    text += `\n💻 <b>الخدمات التقنية والمصادر الإلكترونية</b>\n`;
    text += `   ${result.TSER} ${currency}\n\n`;
    
    if (result.VAT > 0) {
      text += `🧾 <b>ضريبة القيمة المضافة (15%)</b>\n`;
      text += `   ${result.VAT} ${currency}\n\n`;
    }
    
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `💰 <b>الإجمالي</b>: ${result.total} ${currency}`;
    text += `\n━━━━━━━━━━━━━━━━━━━━`;
  }

  return text;
}