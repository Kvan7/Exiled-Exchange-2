import { ISectionAdapter, MappingRule } from "./ISectionAdapter";

export class ThaiAdapter implements ISectionAdapter {
    private rules: MappingRule[] = [
        // Gears
        {
            pattern: /^ชนิดไอเทม: (.+)$/,
            replacement: (_m) => `Item Class: ${ThaiAdapter.translateItemClass(_m[1])}`
        },
        {
            pattern: /^ความหายาก: (.+)$/,
            replacement: (_m) => `Rarity: ${ThaiAdapter.translateRarity(_m[1])}`
        },
        {
            pattern: /^ต้องการ: เลเวล (.+)$/,
            replacement: 'Requires: Level $1'
        },
        {
            pattern: /^เลเวลไอเทม: (\d+)$/,
            replacement: 'Item Level: $1'
        },
        {
            pattern: /^ค่าคุณภาพ: (.+)$/,
            replacement: 'Quality: $1'
        },
        {
            pattern: /^อัตราการหลบหลีก: (.+)$/,
            replacement: 'Evasion Rating: $1'
        },
        {
            pattern: /^โล่พลังงาน: (.+)$/,
            replacement: 'Energy Shield: $1'
        },
        {
            pattern: /^รู: (.+)$/,
            replacement: 'Sockets: $1'
        },

        // Implicits
        {
            pattern: /^เพิ่มความยากในการติดสถานะ สตัน (\d+)% \(implicit\)$/,
            replacement: '$1% increased Stun Threshold (implicit)'
        },

        // Prefixes
        {
            pattern: /^พลังชีวิตสูงสุด \+(.+)$/,
            replacement: '+$1 to maximum Life'
        },
        {
            pattern: /^โล่พลังงานสูงสุด \+(.+)$/,
            replacement: '+$1 to maximum Energy Shield'
        },
        {
            pattern: /^อัตราการหลบหลีก \+(.+)$/,
            replacement: '+$1 to Evasion Rating',
        },
        {
            pattern: /^เพิ่มการหลบหลีกและโล่พลังงาน (.+)$/,
            replacement: '$1 increased Evasion and Energy Shield',
        },

        // Suffixes
        {
            pattern: /^ค่าต้านทาน ไฟ \+(.+)%(.*)$/,
            replacement: '+$1% to Fire Resistance$2'
        },
        {
            pattern: /^ค่าต้านทาน น้ำแข็ง \+(.+)%(.*)$/,
            replacement: '+$1% to Cold Resistance$2'
        },
        {
            pattern: /^ค่าต้านทาน สายฟ้า \+(.+)%(.*)$/,
            replacement: '+$1% to Lightning Resistance$2'
        },
        {
            pattern: /^ค่าต้านทาน เคออส \+(.+)%(.*)$/,
            replacement: '+$1% to Chaos Resistance$2'
        },


        // Runes
        {
            pattern: /^เพิ่มค่าเกราะ, การหลบหลีก, โล่พลังงาน (\d+)% \(rune\)$/,
            replacement: '$1% increased Armour, Evasion and Energy Shield (rune)'
        },

        // Prefix/Suffix descriptor
        {
            pattern: /^\{\s*(ม็อดพรีฟิกซ์|ม็อดซัฟฟิกซ์)\s*"(.*)"*"\s*\(ระดับ:\s*(\d+)\)\s*—\s*(.*?)\s*\}$/,
            replacement: (_m) => {
                const identifier = _m[1];
                const label = _m[2];
                const tier = _m[3];
                const descriptors = _m[4].split(',');

                const translatedIdentifier =
                    identifier == "ม็อดพรีฟิกซ์"
                        ? "Prefix Modifier"
                        : identifier == "ม็อดซัฟฟิกซ์"
                            ? "Suffix Modifier"
                            : identifier; // this is fucked.
                            
                const translatedDescriptors = descriptors.map(ThaiAdapter.translateDescriptor).join(', ');

                return `{ ${translatedIdentifier} "${label}" (Tier: ${tier}) — ${translatedDescriptors} }`
            },
        },

        // Default
        {
            pattern: /^([a-zA-Z]+) \+(\d+)$/, //probably not a good idea, but worth trying. just make sure that all language-specific rules are defined above.
            replacement: '$1 to $2'
        },
    ];

    transform(line: string): string {
        try {
            for (const rule of this.rules) {
                const match = line.match(rule.pattern);

                if (match) {
                    if (typeof rule.replacement === 'function') {
                        return rule.replacement(match);
                    } else {
                        return line.replace(rule.pattern, rule.replacement);
                    }
                }
            }

            return line;
        } catch (err) {
            console.error(err);
            console.error(line);

            throw err;
        }
    }

    private static translateItemClass(text: string): string {
        const map: Record<string, string> = {
            'เข็มขัด': 'Belts',
            'แหวน': 'Ring',
        };
        return map[text] || text;
    }

    private static translateRarity(text: string): string {
        const map: Record<string, string> = {
            'ยูนิค': 'Unique',
            'แรร์': 'Rare',
        };
        return map[text] || text;
    }

    private static translateDescriptor(text: string): string {
        return text;
    }
}