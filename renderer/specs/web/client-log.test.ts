import { beforeEach, describe, expect, it, vi } from "vitest";
import { setupTests } from "@specs/vitest.setup";
import { loadForLang } from "@/assets/data";
import { handleLine } from "@/web/client-log/client-log";

const log = `
2025/09/11 18:21:43 167690796 f0c29dd2 [INFO Client 438888] Doodad hash: 1705339803
2025/09/11 18:21:43 167690843 775aed1e [INFO Client 438888] [SCENE] Set Source [(null)]
2025/09/11 18:21:43 167690843 775aed1e [INFO Client 438888] [SCENE] Set Source [Vastiri Outskirts]
2025/09/11 18:21:43 167690937 99240e15 [DEBUG Client 438888] [SCENE] Height Map Texture: 630 x 1200
2025/09/11 18:21:43 167691140 1a62040f [DEBUG Client 438888] Joined guild named Woolie's UNGA BUNGAS with 107 members
2025/09/11 18:21:43 167691187 1a61ee40 [DEBUG Client 438888] InstanceClientSetSelfPartyInvitationSecurityCode = 0
2025/09/11 18:24:03 167830843 3ef232c2 [INFO Client 438888] : Kvan_seven_abyss (Mercenary) is now level 16
2025/09/11 18:24:14 167841593 3ef232c2 [INFO Client 438888] : Kvan_seven_abyss has been slain.
2025/09/11 18:24:17 167845421 2d8e9f5f [DEBUG Client 438888] Got Instance Details from login server
2025/09/11 18:24:17 167845421 91c6ccb [INFO Client 438888] Connecting to instance server at 89.104.170.75:21360
2025/09/11 18:24:17 167845468 91c64c9 [DEBUG Client 438888] Connect time to instance server was 32ms
2025/09/11 18:24:17 167845515 2caa1b1f [DEBUG Client 438888] Client-Safe Instance ID = 2369603477
2025/09/11 18:24:17 167845515 2caa1afc [DEBUG Client 438888] Generating level 16 area "G2_1" with seed 3515667606
2025/09/11 18:24:18 167845640 f0c29dd3 [INFO Client 438888] Tile hash: 3342134387
2025/09/11 18:24:18 167845640 f0c29dd2 [INFO Client 438888] Doodad hash: 1705339803
2025/09/11 18:24:18 167845640 775aed1e [INFO Client 438888] [SCENE] Set Source [(null)]
2025/09/11 18:24:18 167845656 775aed1e [INFO Client 438888] [SCENE] Set Source [Vastiri Outskirts]
2025/09/11 18:24:18 167845703 99240e15 [DEBUG Client 438888] [SCENE] Height Map Texture: 630 x 1200
2025/09/11 18:24:18 167846015 1a62040f [DEBUG Client 438888] Joined guild named Woolie's UNGA BUNGAS with 107 members
2025/09/11 18:24:18 167846015 1a61ee40 [DEBUG Client 438888] InstanceClientSetSelfPartyInvitationSecurityCode = 0
2025/09/11 18:25:10 167897828 f4ab5af9 [INFO Client 438888] Successfully unallocated passive skill id: armour_break37, name: Cruel Methods
2025/09/11 18:29:02 168130500 3ef232c2 [INFO Client 438888] : Kvan_seven_abyss (Mercenary) is now level 17
2025/09/11 18:29:16 168143828 2d8e9f5f [DEBUG Client 438888] Got Instance Details from login server
2025/09/11 18:29:16 168143843 91c6ccb [INFO Client 438888] Connecting to instance server at 89.104.170.75:21360
2025/09/11 18:29:16 168143890 91c64c9 [DEBUG Client 438888] Connect time to instance server was 32ms
2025/09/11 18:29:16 168143921 2caa1b1f [DEBUG Client 438888] Client-Safe Instance ID = 2080218402
2025/09/11 18:29:16 168143921 2caa1afc [DEBUG Client 438888] Generating level 16 area "G2_1" with seed 3515667606
2025/09/11 18:29:16 168144046 f0c29dd3 [INFO Client 438888] Tile hash: 3342134387
`;

describe("clientLog", () => {
  beforeEach(async () => {
    setupTests();
    await loadForLang("en");
    vi.clearAllMocks();
  });

  it("should parse", () => {
    for (const line of log.split("\n")) {
      expect(() => {
        handleLine(line);
      }).not.toThrow();
    }
  });
});
