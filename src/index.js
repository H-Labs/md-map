"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
var MarkdownIt = require("markdown-it");
var MarkdownItMark = require("markdown-it-mark");
var MarkdownItSub = require("markdown-it-sub");
var MarkdownItSup = require("markdown-it-sup");
var Regs = {
    heading: /^#{1,6}\s/,
    orderedListItem: /^\d{1,}\.\s/,
    unorderedListItem: /^[\+|\-|\*]\s/
};
var LineType;
(function (LineType) {
    LineType[LineType["Empty"] = 0] = "Empty";
    LineType[LineType["Heading1"] = 1] = "Heading1";
    LineType[LineType["Heading2"] = 2] = "Heading2";
    LineType[LineType["Heading3"] = 3] = "Heading3";
    LineType[LineType["Heading4"] = 4] = "Heading4";
    LineType[LineType["Heading5"] = 5] = "Heading5";
    LineType[LineType["Heading6"] = 6] = "Heading6";
    LineType[LineType["Paragraph"] = 7] = "Paragraph";
    LineType[LineType["OrderedListItem"] = 8] = "OrderedListItem";
    LineType[LineType["UnorderedListItem"] = 9] = "UnorderedListItem";
})(LineType || (LineType = {}));
var mdIt = new MarkdownIt()
    .use(MarkdownItMark)
    .use(MarkdownItSub)
    .use(MarkdownItSup);
function parseLineData(line) {
    if (!line
        || !line.length) {
        return {
            type: LineType.Empty,
            content: ''
        };
    }
    var data = {
        type: LineType.Paragraph,
        content: line
    };
    // heading
    if (Regs.heading.test(line)) {
        switch (line.indexOf(' ')) {
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
        data.type = LineType.OrderedListItem;
        data.content = line.replace(Regs.orderedListItem, '');
    }
    // unordered list
    if (Regs.unorderedListItem.test(line)) {
        data.type = LineType.UnorderedListItem;
        data.content = line.replace(Regs.unorderedListItem, '');
    }
    return data;
}
function parseLine(line, index) {
    var data = __assign(__assign({ line: index }, parseLineData(line)), { raw: line, html: mdIt.render(line)
            .replace(/\n/g, '') });
    return data;
}
function parseLines(lines) {
    var lineData = lines.map(function (line, index) { return parseLine(line, index); });
    return lineData;
}
var tree = {
    id: 0,
    parent: undefined,
    type: LineType.Empty,
    raw: '',
    html: '',
    children: []
};
function pushToTree(item, id) {
    if (id === undefined) {
        tree.raw = item.raw;
        tree.html = item.html;
    }
    if (id === 0) {
        tree.children.push(item);
    }
    else {
        for (var i = tree.children.length - 1; i >= 0; i -= 1) {
            var level2 = tree.children[i];
            if (level2.id === id) {
                tree.children[i]
                    .children.push(item);
                break;
            }
            for (var j = level2.children.length - 1; j >= 0; j -= 1) {
                var level3 = level2.children[j];
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
function generateTree(list) {
    var parentId = undefined;
    var lastItem = {
        id: 0,
        parent: undefined,
        type: LineType.Empty,
        raw: '',
        html: '',
        children: []
    };
    for (var _i = 0, list_1 = list; _i < list_1.length; _i++) {
        var item = list_1[_i];
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
            lastItem = __assign(__assign({ id: item.line, parent: parentId }, item), { children: [] });
            pushToTree(lastItem, parentId);
        }
    }
}
function parse(md, config) {
    if (!md) {
        throw new Error('Markdown content is empty');
    }
    var lineData = parseLines(md.split('\n'));
    generateTree(lineData);
    return tree;
}
exports["default"] = {
    parse: parse
};
