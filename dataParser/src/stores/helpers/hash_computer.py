import struct

from murmurhash2 import murmurhash2


class HashComputer:
    def __init__(self, salt1: int = 0xC58F1A7B, salt2: int = 0x02312233):
        self.salt1: int = salt1
        self.salt2: int = salt2

    def compute_hash(self, in_id: list[str]) -> int:
        h: list[int] = []
        for i in in_id:
            h.append(self.hash1(i.encode()))

        b = b"".join(struct.pack("<I", i) for i in h)
        return self.hash2(b)

    def hash1(self, b: bytes) -> int:
        return murmurhash2(b, seed=self.salt1)

    def hash2(self, b: bytes) -> int:
        return murmurhash2(b, seed=self.salt2)
