import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import type { Root, List, ListItem, Text, Node, Paragraph } from 'mdast';

export interface ParsedTask {
  id: string;
  content: string;
  isCompleted: boolean;
  isPinned: boolean;
  children: ParsedTask[];
}

const processor = unified().use(remarkParse).use(remarkGfm);
let taskIdCounter = 0;

/**
 * 輔助函式：安全地遞迴遍歷任何 mdast 節點，並提取所有文字內容。
 * @param node - mdast 語法樹中的任何節點。
 * @returns {string} - 拼接後的純文字。
 */
function stringifyNode(node: Node): string {
  if (node.type === 'text') {
    return (node as Text).value;
  }
  
  if ('children' in node && Array.isArray(node.children)) {
    return (node.children as any[]).map(stringifyNode).join('');
  }
  
  return '';
}

/**
 * 輔助函式：遞迴地處理 mdast 節點，將其轉換為我們的 ParsedTask 結構
 * @param node - mdast 語法樹中的 List 或 ListItem 節點
 */
function processNode(node: List | ListItem): ParsedTask[] {
  const tasks: ParsedTask[] = [];

  for (const child of node.children) {
    if (child.type !== 'listItem') continue;

    const listItem = child as ListItem;
    const isCompleted = listItem.checked === true;

    // --- 修改點：精準提取當前任務行的文字 ---
    // 目的：只尋找並處理 ListItem 下的第一個 Paragraph 作為其內容，
    // 忽略後續的巢狀 List，從而避免文字串接問題。
    const paragraphNode = listItem.children.find(childNode => childNode.type === 'paragraph') as Paragraph;
    let textContent = paragraphNode ? stringifyNode(paragraphNode).trim() : '';

    const isPinned = textContent.includes('[pinned]');
    if (isPinned) {
      textContent = textContent.replace(/\[pinned\]/g, '').trim();
    }

    const task: ParsedTask = {
      id: `task-${taskIdCounter++}`,
      content: textContent,
      isCompleted,
      isPinned,
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