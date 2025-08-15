import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import type { Root, List, ListItem, Text, Node, Paragraph } from 'mdast';

export interface ParsedTask {
  id: string;
  content: string;
  isCompleted: boolean;
  isPinned: boolean;
  // --- 1. 新增 dueDate 屬性 ---
  // 目的：在我們的資料結構中，為截止日期預留一個位置。
  // 'string | null' 型別表示一個任務可以有截止日期，也可以沒有。
  dueDate: string | null;
  children: ParsedTask[];
}

const processor = unified().use(remarkParse).use(remarkGfm);
let taskIdCounter = 0;

function stringifyNode(node: Node): string {
  if (node.type === 'text') {
    return (node as Text).value;
  }
  
  if ('children' in node && Array.isArray(node.children)) {
    return (node.children as any[]).map(stringifyNode).join('');
  }
  
  return '';
}

function processNode(node: List | ListItem): ParsedTask[] {
  const tasks: ParsedTask[] = [];

  for (const child of node.children) {
    if (child.type !== 'listItem') continue;

    const listItem = child as ListItem;
    const isCompleted = listItem.checked === true;

    const paragraphNode = listItem.children.find(childNode => childNode.type === 'paragraph') as Paragraph;
    let textContent = paragraphNode ? stringifyNode(paragraphNode).trim() : '';

    // --- 2. 新增：解析截止日期 ---
    // 目的：使用正規表示式來尋找並提取截止日期的標籤。
    let dueDate: string | null = null;
    const dueDateMatch = textContent.match(/\[截止:(\d{4}-\d{2}-\d{2})\]/);
    if (dueDateMatch) {
      dueDate = dueDateMatch[1]; // 提取日期字串，例如 "2025-08-15"
      textContent = textContent.replace(dueDateMatch[0], '').trim(); // 從內容中移除標籤
    }

    const isPinned = textContent.includes('[pinned]');
    if (isPinned) {
      textContent = textContent.replace(/\[pinned\]/g, '').trim();
    }

    const task: ParsedTask = {
      id: `task-${taskIdCounter++}`,
      content: textContent,
      isCompleted,
      isPinned,
      dueDate, // 將解析出的日期存入物件
      children: [],
    };

    const subList = listItem.children.find(childNode => childNode.type === 'list');
    if (subList) {
      task.children = processNode(subList as List);
    }
    
    tasks.push(task);
  }

  return tasks;
}

/**
 * 核心函式：將完整的 Markdown 文字解析為巢狀的任務列表
 * @param markdownContent - 包含任務清單的 Markdown 純文字
 * @returns {ParsedTask[]} - 解析後的任務物件陣列
 */
export function parseMarkdownToTasks(markdownContent: string): ParsedTask[] {
  taskIdCounter = 0;
  const tree = processor.parse(markdownContent) as Root;
  const topLevelTasks: ParsedTask[] = [];

  for (const node of tree.children) {
    if (node.type === 'list') {
      topLevelTasks.push(...processNode(node));
    }
  }

  return topLevelTasks;
}