import * as MarkdownIt from 'markdown-it';
import * as MarkdownItMark from 'markdown-it-mark';
import * as MarkdownItSub from 'markdown-it-sub';
import * as MarkdownItSup from 'markdown-it-sup';

const Regs = {
  heading: /^#{1,6}\s/,
  orderedListItem: /^\d{1,}\.\s/,
  unorderedListItem: /^[\+|\-|\*]\s/,
};

interface ParseConfig {
  rootNode?: string,
}

interface MapItem {
  id: number,
  parent: number | undefined,
  type: LineType,
  raw: string,
  html: string,
}

interface MapTree extends MapItem {
  children: Array<MapTree>,
}

enum LineType {
  Empty,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Paragraph,
  OrderedListItem,
  UnorderedListItem,
}

interface LineData {
  line: number,
  type: LineType,
  raw: string,
  content: string,
  html: string,
}

const mdIt = new MarkdownIt()
  .use(MarkdownItMark)
  .use(MarkdownItSub)
  .use(MarkdownItSup);

function parseLineData(line: string): {
  type: LineType,
  content: string,
} {
  if (!line
      || !line.length) {
    return {
      type: LineType.Empty,
      content: '',
    };
  }

  const data = {
    type: LineType.Paragraph,
    content: line,
  };

  // heading
  if (Regs.heading.test(line)) {
    switch(line.indexOf(' ')) {
      case 1:
        data.type = LineType.Heading1;
        break;
      case 2:
        data.type = LineType.Heading2;
        break;
      case 3:
        data.type = LineType.Heading3;
        break;
      case 4:
        data.type = LineType.Heading4;
        break;
      case 5:
        data.type = LineType.Heading5;
        break;
      case 6:
        data.type = LineType.Heading6;
        break;
    }
    data.content = line.replace(Regs.heading, '');
  }

  // ordered list
  if (Regs.orderedListItem.test(line)) {
    data.type =  LineType.OrderedListItem;
    data.content = line.replace(Regs.orderedListItem, '');
  }

  // unordered list
  if (Regs.unorderedListItem.test(line)) {
    data.type =  LineType.UnorderedListItem;
    data.content = line.replace(Regs.unorderedListItem, '');
  }

  return data;
}

function parseLine(line: string, index: number) {
  const data: LineData = {
    line: index,
    ...parseLineData(line),
    raw: line,
    html: mdIt.render(line)
      .replace(/\n/g, ''),
  };

  return data;
}

function parseLines(lines: Array<string>): Array<LineData> {
  const lineData: Array<LineData> = lines.map((line, index) => parseLine(line, index));

  return lineData;
}

const tree: MapTree = {
  id: 0,
  parent: undefined,
  type: LineType.Empty,
  raw: '',
  html: '',
  children: [],
};

function pushToTree(item: MapTree, id?: number): void {
  if (id === undefined) {
    tree.raw = item.raw;
    tree.html = item.html;
  } if (id === 0) {
    tree.children.push(item);
  } else {
    for (let i = tree.children.length - 1; i >= 0; i -= 1) {
      const level2 = tree.children[i];
      if (level2.id === id) {
        tree.children[i]
          .children.push(item);
        break;
      }

      for (let j = level2.children.length - 1; j >= 0; j -= 1) {
        const level3 = level2.children[j];
        if (level3.id === id) {
          tree.children[i]
            .children[j]
            .children.push(item);
          break;
        }
      }
    }
  }
}

function generateTree(list: Array<LineData>): void {
  let parentId: number | undefined = undefined;
  let lastItem: MapTree = {
    id: 0,
    parent: undefined,
    type: LineType.Empty,
    raw: '',
    html: '',
    children: [],
  };

  for (const item of list) {
    switch (item.type) {
      case LineType.Heading1: // root node
        parentId = undefined;
        break;
      case LineType.Heading2: // level 2
        parentId = 0;
        break;
      case LineType.Heading3: // level 3
        if (lastItem.type === LineType.Heading2) {
          parentId = lastItem.id;
        }
        break;
      case LineType.OrderedListItem:
      case LineType.Paragraph:
      case LineType.UnorderedListItem:
        if ([
          LineType.Heading1,
          LineType.Heading2,
          LineType.Heading3,
        ].includes(lastItem.type)) {
          parentId = lastItem.id;
        }
        break;
    }
    if (item.type !== LineType.Empty) {
      lastItem = {
        id: item.line,
        parent: parentId,
        ...item,
        children: [],
      };
      pushToTree(lastItem, parentId);
    }
  }
}

function parse(md: string, config?: ParseConfig): MapTree {
  if (!md) {
    throw new Error('Markdown content is empty');
  }

  const lineData = parseLines(md.split('\n'));

  generateTree(lineData);

  return tree;
}

export default {
  parse,
};
