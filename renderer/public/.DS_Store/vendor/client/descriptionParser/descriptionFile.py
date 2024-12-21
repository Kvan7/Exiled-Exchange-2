from pprint import pprint

from descriptionParser.description import Description


class DescriptionFile:
    def __init__(self, filePath, encoding="utf-16", lang="English"):
        self.filePath = filePath
        self.encoding = encoding
        self.lang = lang
        self.fileLines = self.load(self.filePath)
        self.blocks = self.split_into_description_blocks(self.fileLines)
        self.descriptions = [
            Description(block, lang=self.lang) for block in self.blocks
        ]
        self.descriptions_lookup = {d.id: d for d in self.descriptions}

    def __str__(self):
        return f"DescriptionFile(descriptions={self.descriptions})"

    def load(self, filePath: str) -> list[str]:
        with open(filePath, "r", encoding=self.encoding) as f:
            lines = f.readlines()
        # trim up until the first description block
        while not lines[0].startswith("description"):
            lines.pop(0)
        return lines

    def split_into_description_blocks(self, lines: list[str]) -> list[list[str]]:
        blocks = [[]]

        for i in range(len(lines)):
            if lines[i].startswith("description"):
                if len(blocks) > 0 and len(blocks[-1]) > 0 and blocks[-1][-1] == "\n":
                    # remove last empty line
                    blocks[-1].pop()
                blocks.append([])
            blocks[-1].append(lines[i])
        if len(blocks[-1]) > 0 and blocks[-1][-1] == "\n":
            # remove last empty line
            blocks[-1].pop()
        if len(blocks[0]) == 0:
            blocks.pop(0)
        return blocks
