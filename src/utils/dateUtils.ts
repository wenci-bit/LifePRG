/**
 * 日期工具函数
 *
 * 提供日期处理、格式化、计算等功能
 */

/**
 * 格式化日期为 YYYY-MM-DD（本地时间）
 */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 格式化日期时间为 YYYY-MM-DD HH:mm
 */
export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  const dateStr = formatLocalDate(date);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${dateStr} ${hours}:${minutes}`;
}

/**
 * 格式化时间为 HH:mm
 */
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * 获取本周的开始和结束日期
 */
export function getWeekRange(date: Date = new Date()): { start: Date; end: Date } {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // 周一为一周的开始

  const start = new Date(date);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/**
 * 获取本月的开始和结束日期
 */
export function getMonthRange(date: Date = new Date()): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

  return { start, end };
}

/**
 * 获取本年的开始和结束日期
 */
export function getYearRange(date: Date = new Date()): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0);
  const end = new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);

  return { start, end };
}

/**
 * 获取一天的开始和结束时间
 */
export function getDayRange(date: Date = new Date()): { start: Date; end: Date } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/**
 * 获取指定周的所有日期
 */
export function getWeekDays(date: Date = new Date()): Date[] {
  const { start } = getWeekRange(date);
  const days: Date[] = [];

  for (let i = 0; i < 7; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    days.push(day);
  }

  return days;
}

/**
 * 获取从指定日期开始的连续N天
 */
export function getConsecutiveDays(startDate: Date, numDays: number): Date[] {
  const days: Date[] = [];

  for (let i = 0; i < numDays; i++) {
    const day = new Date(startDate);
    day.setDate(startDate.getDate() + i);
    days.push(day);
  }

  return days;
}

/**
 * 获取指定月的所有日期
 */
export function getMonthDays(date: Date = new Date()): Date[] {
  const { start, end } = getMonthRange(date);
  const days: Date[] = [];

  const current = new Date(start);
  while (current <= end) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return days;
}

/**
 * 检查两个日期是否是同一天
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return formatLocalDate(date1) === formatLocalDate(date2);
}

/**
 * 检查日期是否是今天
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * 检查日期是否在范围内
 */
export function isDateInRange(date: Date, start: Date, end: Date): boolean {
  const timestamp = date.getTime();
  return timestamp >= start.getTime() && timestamp <= end.getTime();
}

/**
 * 获取两个日期之间的天数差
 */
export function getDaysDifference(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * 添加天数到日期
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * 添加月份到日期
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * 获取月份名称
 */
export function getMonthName(month: number): string {
  const months = [
    '一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月'
  ];
  return months[month];
}

/**
 * 获取星期名称
 */
export function getWeekDayName(day: number): string {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return days[day];
}

/**
 * 获取相对时间描述
 */
export function getRelativeTimeDescription(timestamp: number): string {
  const now = Date.now();
  const diff = timestamp - now;
  const absDiff = Math.abs(diff);

  const minutes = Math.floor(absDiff / (1000 * 60));
  const hours = Math.floor(absDiff / (1000 * 60 * 60));
  const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));

  if (diff < 0) {
    // 过去
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return formatLocalDate(new Date(timestamp));
  } else {
    // 未来
    if (minutes < 1) return '马上';
    if (minutes < 60) return `${minutes}分钟后`;
    if (hours < 24) return `${hours}小时后`;
    if (days < 7) return `${days}天后`;
    return formatLocalDate(new Date(timestamp));
  }
}

/**
 * 获取时间段描述
 */
export function getTimeRangeDescription(start: number, end: number): string {
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (isSameDay(startDate, endDate)) {
    return `${formatTime(start)} - ${formatTime(end)}`;
  }

  return `${formatDateTime(start)} - ${formatDateTime(end)}`;
}
