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
  raw: string,
  html: string,
}

interface MapTree extends MapItem {
  children?: Array<MapTree>,
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
      .replace('\n', ''),
  };

  return data;
}

function parseLines(lines: Array<string>): Array<LineData> {
  const lineData: Array<LineData> = lines.map((line, index) => parseLine(line, index));

  return lineData;
}

function parse(md: string, config?: ParseConfig): MapTree {
  let tree: MapTree = {
    raw: '',
    html: '',
  };

  if (!md) {
    throw new Error('Markdown content is empty');
  }

  const lineData = parseLines(md.split('\n'));
  console.log(lineData);

  return tree;
}

export default {
  parse,
};
