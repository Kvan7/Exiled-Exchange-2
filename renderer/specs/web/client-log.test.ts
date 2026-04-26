import { beforeEach, describe, expect, it, vi } from "vitest";
import { setupTests } from "@specs/vitest.setup";
import { init } from "@/assets/data";
import { useClientLog } from "@/web/client-log/client-log";
import { readFileSync } from "fs";

const log1 = `
2025/09/11 18:21:43 167690796 f0c29dd2 [INFO Client 438888] Doodad hash: 1705339803
2025/09/11 18:21:43 167690843 775aed1e [INFO Client 438888] [SCENE] Set Source [(null)]
2025/09/11 18:21:43 167690843 775aed1e [INFO Client 438888] [SCENE] Set Source [Vastiri Outskirts]
2025/09/11 18:21:43 167690937 99240e15 [DEBUG Client 438888] [SCENE] Height Map Texture: 630 x 1200
2025/09/11 18:21:43 167691140 1a62040f [DEBUG Client 438888] Joined guild named Some guild'e with 107 members
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
2025/09/11 18:24:18 167846015 1a62040f [DEBUG Client 438888] Joined guild named Some guild'e with 107 members
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
const logStartThroughRedVale = `
2026/04/26 09:39:04 1785887718 2d8e9b94 [DEBUG Client 443804] Got Instance Details from login server
2026/04/26 09:39:04 1785887734 91c6cce [INFO Client 443804] Connecting to instance server at 64.87.51.212:21360
2026/04/26 09:39:04 1785887750 91c63c3 [DEBUG Client 443804] Connect time to instance server was 0ms
2026/04/26 09:39:04 1785887765 2caa1e5f [DEBUG Client 443804] Client-Safe Instance ID = 2602190485
2026/04/26 09:39:04 1785887765 2caa22d2 [DEBUG Client 443804] Generating level 2 area "G1_2" with seed 175573176
2026/04/26 09:39:04 1785888156 f0c29dd3 [INFO Client 443804] Tile hash: 232964553
2026/04/26 09:39:04 1785888156 f0c29dd2 [INFO Client 443804] Doodad hash: 2779329037
2026/04/26 09:39:04 1785888296 7fbd122e [INFO Client 443804] [SCENE] Set Source [(null)]
2026/04/26 09:39:04 1785888296 7fbd122e [INFO Client 443804] [SCENE] Set Source [Clearfell]
2026/04/26 09:39:04 1785888484 1a620748 [DEBUG Client 443804] Joined guild named Some guild'e with 97 members
2026/04/26 09:39:04 1785888500 1a62038d [DEBUG Client 443804] InstanceClientSetSelfPartyInvitationSecurityCode = 0
2026/04/26 09:39:13 1785897437 2d8e9b94 [DEBUG Client 443804] Got Instance Details from login server
2026/04/26 09:39:13 1785897437 91c6cce [INFO Client 443804] Connecting to instance server at 64.87.51.236:21360
2026/04/26 09:39:13 1785897453 91c63c3 [DEBUG Client 443804] Connect time to instance server was 16ms
2026/04/26 09:39:13 1785897468 2caa1e5f [DEBUG Client 443804] Client-Safe Instance ID = 3821972762
2026/04/26 09:39:13 1785897468 2caa22d2 [DEBUG Client 443804] Generating level 15 area "G1_town" with seed 1
2026/04/26 09:39:13 1785897500 f0c29dd3 [INFO Client 443804] Tile hash: 892597717
2026/04/26 09:39:13 1785897500 f0c29dd2 [INFO Client 443804] Doodad hash: 2628743579
2026/04/26 09:39:13 1785897609 7fbd122e [INFO Client 443804] [SCENE] Set Source [(null)]
2026/04/26 09:39:13 1785897609 7fbd122e [INFO Client 443804] [SCENE] Set Source [Clearfell Encampment]
2026/04/26 09:39:14 1785897687 1a620748 [DEBUG Client 443804] Joined guild named Some guild'e with 97 members
2026/04/26 09:39:14 1785897703 1a62038d [DEBUG Client 443804] InstanceClientSetSelfPartyInvitationSecurityCode = 0
2026/04/26 09:39:33 1785916796 4f3e4d2a [INFO Client 443804] Async connecting to dal.login.pathofexile2.com:21262
2026/04/26 09:39:33 1785916812 4f3e4ba7 [INFO Client 443804] Connected to dal.login.pathofexile2.com in 0ms.
2026/04/26 09:39:33 1785916953 7fbd122e [INFO Client 443804] [SCENE] Set Source [(null)]
2026/04/26 09:39:33 1785917015 bdc24083 [INFO Client 443804] [EShop Request] Attempting to request site settings
2026/04/26 09:39:33 1785917156 7fbd122e [INFO Client 443804] [SCENE] Set Source [(unknown)]
2026/04/26 09:39:45 1785929468 7fbd122e [INFO Client 443804] [SCENE] Set Source [(null)]
2026/04/26 09:39:45 1785929484 2d8e9b94 [DEBUG Client 443804] Got Instance Details from login server
2026/04/26 09:39:45 1785929484 91c6cce [INFO Client 443804] Connecting to instance server at 64.87.51.236:21360
2026/04/26 09:39:45 1785929515 91c63c3 [DEBUG Client 443804] Connect time to instance server was 16ms
2026/04/26 09:39:45 1785929515 8fba9720 [DEBUG Client 443804] [EShop CallForAction] Load starts at 1785929550
2026/04/26 09:39:45 1785929515 8fba870a [WARN Client 443804] [EShop CallForAction] Failed to parse call for action of PaymentPackages
2026/04/26 09:39:45 1785929515 8fba96e6 [DEBUG Client 443804] [EShop CallForAction] Load ends at 1785929550
2026/04/26 09:39:45 1785929531 2caa1e5f [DEBUG Client 443804] Client-Safe Instance ID = 3821972762
2026/04/26 09:39:45 1785929531 2caa22d2 [DEBUG Client 443804] Generating level 15 area "G1_town" with seed 1
2026/04/26 09:39:45 1785929562 f0c29dd3 [INFO Client 443804] Tile hash: 892597717
2026/04/26 09:39:45 1785929562 f0c29dd2 [INFO Client 443804] Doodad hash: 2628743579
2026/04/26 09:39:46 1785929671 7fbd122e [INFO Client 443804] [SCENE] Set Source [Clearfell Encampment]
2026/04/26 09:39:46 1785929750 1a620748 [DEBUG Client 443804] Joined guild named Some guild'e with 97 members
2026/04/26 09:39:46 1785929765 1a62038d [DEBUG Client 443804] InstanceClientSetSelfPartyInvitationSecurityCode = 0
2026/04/26 09:39:46 1785929968 d7c737f0 [CRIT Client 443804] Unable to load steam stats. Achievements will not work. Error: 2
2026/04/26 09:39:46 1785930093 3ef232c2 [INFO Client 443804] : You have joined global chat channel 100 English.
2026/04/26 09:39:46 1785930093 3ef232c2 [INFO Client 443804] : You have joined trade chat channel 820 English.
2026/04/26 09:39:47 1785930765 bf08f15c [INFO Client 443804] [Item Filter] Preparing to download online filter jeOW68UJ
2026/04/26 09:39:47 1785930765 bf08f196 [INFO Client 443804] [Item Filter] Hash for online filter jeOW68UJ is: 2c868b25951a2502dbc013547e30f29d
2026/04/26 09:39:47 1785930968 bf08f190 [INFO Client 443804] [Item Filter] Online item filter jeOW68UJ returned status: 304
2026/04/26 09:39:47 1785930968 bf08f1fa [DEBUG Client 443804] [Item Filter] Online item filter request resolved to: 2600:1405:e400:3::1737:ec8b
2026/04/26 09:39:47 1785930968 ddd288d2 [INFO Client 443804] [Item Filter] Finished reloading online filter jeOW68UJ. Result: true. Hash: 2c868b25951a2502dbc013547e30f29d. Type: Normal. Message:
2026/04/26 09:41:14 1786018562 528852f8 [INFO Client 443804] [WINDOW] Lost focus
2026/04/26 09:42:18 1786081859 52884db2 [INFO Client 443804] [WINDOW] Gained focus
2026/04/26 09:42:19 1786083250 4f3e4d2a [INFO Client 443804] Async connecting to dal.login.pathofexile2.com:21262
2026/04/26 09:42:19 1786083265 4f3e4ba7 [INFO Client 443804] Connected to dal.login.pathofexile2.com in 0ms.
2026/04/26 09:42:19 1786083375 7fbd122e [INFO Client 443804] [SCENE] Set Source [(null)]
2026/04/26 09:42:19 1786083437 bdc24083 [INFO Client 443804] [EShop Request] Attempting to request site settings
2026/04/26 09:42:19 1786083531 7fbd122e [INFO Client 443804] [SCENE] Set Source [(unknown)]
2026/04/26 09:42:23 1786087062 528852f8 [INFO Client 443804] [WINDOW] Lost focus
2026/04/26 09:42:32 1786096250 52884db2 [INFO Client 443804] [WINDOW] Gained focus
2026/04/26 09:42:41 1786105359 62cf86ba [INFO Client 443804] [DXC] Successfully loaded "dxcompiler.dll"
2026/04/26 09:42:59 1786122906 528852f8 [INFO Client 443804] [WINDOW] Lost focus
2026/04/26 09:43:03 1786127390 52884db2 [INFO Client 443804] [WINDOW] Gained focus
2026/04/26 09:43:11 1786135031 7fbd122e [INFO Client 443804] [SCENE] Set Source [(null)]
2026/04/26 09:43:11 1786135046 2d8e9b94 [DEBUG Client 443804] Got Instance Details from login server
2026/04/26 09:43:11 1786135046 91c6cce [INFO Client 443804] Connecting to instance server at 64.87.51.228:21360
2026/04/26 09:43:11 1786135078 91c63c3 [DEBUG Client 443804] Connect time to instance server was 16ms
2026/04/26 09:43:11 1786135078 8fba9720 [DEBUG Client 443804] [EShop CallForAction] Load starts at 1786135109
2026/04/26 09:43:11 1786135078 8fba870a [WARN Client 443804] [EShop CallForAction] Failed to parse call for action of PaymentPackages
2026/04/26 09:43:11 1786135078 8fba96e6 [DEBUG Client 443804] [EShop CallForAction] Load ends at 1786135109
2026/04/26 09:43:11 1786135093 2caa1e5f [DEBUG Client 443804] Client-Safe Instance ID = 3755594703
2026/04/26 09:43:11 1786135093 2caa22d2 [DEBUG Client 443804] Generating level 1 area "G1_1" with seed 2590316184
2026/04/26 09:43:11 1786135328 d7c737f0 [CRIT Client 443804] Unable to load steam stats. Achievements will not work. Error: 2
2026/04/26 09:43:11 1786135421 f0c29dd3 [INFO Client 443804] Tile hash: 3779877309
2026/04/26 09:43:11 1786135421 f0c29dd2 [INFO Client 443804] Doodad hash: 1320521012
2026/04/26 09:43:11 1786135468 7fbd122e [INFO Client 443804] [SCENE] Set Source [The Riverbank]
2026/04/26 09:43:12 1786135640 1a620748 [DEBUG Client 443804] Joined guild named Some guild'e with 97 members
2026/04/26 09:43:12 1786135640 4d35b2e9 [WARN Client 443804] Tried to SetExtraActivationRangeAroundTile() after level generation was complete
2026/04/26 09:43:12 1786135828 2d8fab12 [INFO Client 443804] Requesting to complete all tutorials due to the client setting
2026/04/26 09:43:12 1786135953 3ef232c2 [INFO Client 443804] : You have joined global chat channel 100 English.
2026/04/26 09:43:13 1786136796 bf08f15c [INFO Client 443804] [Item Filter] Preparing to download online filter jeOW68UJ
2026/04/26 09:43:13 1786136796 bf08f196 [INFO Client 443804] [Item Filter] Hash for online filter jeOW68UJ is: 2c868b25951a2502dbc013547e30f29d
2026/04/26 09:43:13 1786136984 bf08f190 [INFO Client 443804] [Item Filter] Online item filter jeOW68UJ returned status: 304
2026/04/26 09:43:13 1786136984 bf08f1fa [DEBUG Client 443804] [Item Filter] Online item filter request resolved to: 2600:1405:e400:3::1737:ec8b
2026/04/26 09:43:13 1786136984 ddd288d2 [INFO Client 443804] [Item Filter] Finished reloading online filter jeOW68UJ. Result: true. Hash: 2c868b25951a2502dbc013547e30f29d. Type: Normal. Message:
2026/04/26 09:44:30 1786214328 528852f8 [INFO Client 443804] [WINDOW] Lost focus
2026/04/26 09:44:41 1786224859 52884db2 [INFO Client 443804] [WINDOW] Gained focus
2026/04/26 09:44:43 1786226625 3ef232c2 [INFO Client 443804] Wounded Man: By the First Ones! You're alive!
2026/04/26 09:44:46 1786229703 3ef232c2 [INFO Client 443804] Wounded Man: I would appreciate it if you could– argh!
2026/04/26 09:44:53 1786236718 3ef232c2 [INFO Client 443804] Wounded Man: Reach... Clearfell... Find the Miller...
2026/04/26 09:45:44 1786287750 3ef232c2 [INFO Client 443804] Mortimer: You there! Please, aid us!
2026/04/26 09:45:48 1786291640 3ef232c2 [INFO Client 443804] The Bloated Miller: Saw you in half!
2026/04/26 09:45:53 1786297218 3ef232c2 [INFO Client 443804] The Bloated Miller: Split you!
2026/04/26 09:46:03 1786307015 3ef232c2 [INFO Client 443804] The Bloated Miller: Split you!
2026/04/26 09:46:09 1786312890 3ef232c2 [INFO Client 443804] The Bloated Miller: Die!
2026/04/26 09:46:16 1786319828 3ef232c2 [INFO Client 443804] The Bloated Miller: Split you!
2026/04/26 09:46:19 1786322828 3ef232c2 [INFO Client 443804] The Bloated Miller: Die!
2026/04/26 09:46:25 1786328906 3ef232c2 [INFO Client 443804] The Bloated Miller: Split you!
2026/04/26 09:46:35 1786338671 3ef232c2 [INFO Client 443804] The Bloated Miller: Split you!
2026/04/26 09:46:40 1786343843 3ef232c2 [INFO Client 443804] The Bloated Miller: Die!
2026/04/26 09:46:47 1786350750 3ef232c2 [INFO Client 443804] The Bloated Miller: Split you!
2026/04/26 09:46:50 1786354546 3ef232c2 [INFO Client 443804] : kvanClientLogTestOne (Mercenary) is now level 2
2026/04/26 09:46:58 1786361796 3ef232c2 [INFO Client 443804] Mortimer: Well done! Please come inside.
2026/04/26 09:47:00 1786364046 2d8e9b94 [DEBUG Client 443804] Got Instance Details from login server
2026/04/26 09:47:00 1786364046 91c6cce [INFO Client 443804] Connecting to instance server at 64.87.51.236:21360
2026/04/26 09:47:00 1786364062 91c63c3 [DEBUG Client 443804] Connect time to instance server was 16ms
2026/04/26 09:47:00 1786364078 2caa1e5f [DEBUG Client 443804] Client-Safe Instance ID = 1526874667
2026/04/26 09:47:00 1786364078 2caa22d2 [DEBUG Client 443804] Generating level 15 area "G1_town" with seed 1
2026/04/26 09:47:00 1786364109 f0c29dd3 [INFO Client 443804] Tile hash: 892597717
2026/04/26 09:47:00 1786364109 f0c29dd2 [INFO Client 443804] Doodad hash: 2628743579
2026/04/26 09:47:00 1786364218 7fbd122e [INFO Client 443804] [SCENE] Set Source [(null)]
2026/04/26 09:47:00 1786364234 7fbd122e [INFO Client 443804] [SCENE] Set Source [Clearfell Encampment]
2026/04/26 09:47:00 1786364312 1a620748 [DEBUG Client 443804] Joined guild named Some guild'e with 97 members
2026/04/26 09:47:15 1786379312 3ef232c2 [INFO Client 443804] Renly: Take a look.
2026/04/26 09:47:16 1786380140 3ef232c2 [INFO Client 443804] Renly: That'll be useful.
2026/04/26 09:47:45 1786409531 f4ab5a9a [INFO Client 443804] Successfully allocated passive skill id: projectiles18, name: Projectile Damage
2026/04/26 09:47:46 1786410625 2d8e9b94 [DEBUG Client 443804] Got Instance Details from login server
2026/04/26 09:47:47 1786410625 91c6cce [INFO Client 443804] Connecting to instance server at 64.87.51.220:21360
2026/04/26 09:47:47 1786410640 91c63c3 [DEBUG Client 443804] Connect time to instance server was 15ms
2026/04/26 09:47:47 1786410671 2caa1e5f [DEBUG Client 443804] Client-Safe Instance ID = 3729590582
2026/04/26 09:47:47 1786410671 2caa22d2 [DEBUG Client 443804] Generating level 2 area "G1_2" with seed 3171246150
2026/04/26 09:47:47 1786411125 f0c29dd3 [INFO Client 443804] Tile hash: 3405513580
2026/04/26 09:47:47 1786411125 f0c29dd2 [INFO Client 443804] Doodad hash: 1868071080
2026/04/26 09:47:47 1786411281 7fbd122e [INFO Client 443804] [SCENE] Set Source [(null)]
2026/04/26 09:47:47 1786411281 7fbd122e [INFO Client 443804] [SCENE] Set Source [Clearfell]
2026/04/26 09:47:47 1786411484 1a620748 [DEBUG Client 443804] Joined guild named Some guild'e with 97 members
2026/04/26 09:49:43 1786526906 3ef232c2 [INFO Client 443804] Beira of the Rotten Pack: Sleep in ice, wake in snow. Sleep my pretties as you grow...
2026/04/26 09:49:51 1786535390 3ef232c2 [INFO Client 443804] Beira of the Rotten Pack: Invader!
2026/04/26 09:49:53 1786537359 3ef232c2 [INFO Client 443804] Beira of the Rotten Pack: Be still!
2026/04/26 09:50:08 1786552593 3ef232c2 [INFO Client 443804] Beira of the Rotten Pack: Feed!
2026/04/26 09:50:18 1786562421 3ef232c2 [INFO Client 443804] Beira of the Rotten Pack: Be still!
2026/04/26 09:50:24 1786568359 3ef232c2 [INFO Client 443804] Beira of the Rotten Pack: Swell!
2026/04/26 09:50:30 1786574625 3ef232c2 [INFO Client 443804] Beira of the Rotten Pack: Be still!
2026/04/26 09:50:55 1786598625 2d8e9b94 [DEBUG Client 443804] Got Instance Details from login server
2026/04/26 09:50:55 1786598640 91c6cce [INFO Client 443804] Connecting to instance server at 64.87.51.220:21360
2026/04/26 09:50:55 1786598656 91c63c3 [DEBUG Client 443804] Connect time to instance server was 0ms
2026/04/26 09:50:55 1786598671 2caa1e5f [DEBUG Client 443804] Client-Safe Instance ID = 1971986213
2026/04/26 09:50:55 1786598671 2caa22d2 [DEBUG Client 443804] Generating level 4 area "G1_4" with seed 3690647437
2026/04/26 09:50:55 1786599093 f0c29dd3 [INFO Client 443804] Tile hash: 1985582858
2026/04/26 09:50:55 1786599093 f0c29dd2 [INFO Client 443804] Doodad hash: 2117617571
2026/04/26 09:50:55 1786599171 7fbd122e [INFO Client 443804] [SCENE] Set Source [(null)]
2026/04/26 09:50:55 1786599187 7fbd122e [INFO Client 443804] [SCENE] Set Source [The Grelwood]
2026/04/26 09:50:55 1786599406 1a620748 [DEBUG Client 443804] Joined guild named Some guild'e with 97 members
2026/04/26 09:51:13 1786616906 2d8e9b94 [DEBUG Client 443804] Got Instance Details from login server
2026/04/26 09:51:13 1786616906 91c6cce [INFO Client 443804] Connecting to instance server at 64.87.51.212:21360
2026/04/26 09:51:13 1786616921 91c63c3 [DEBUG Client 443804] Connect time to instance server was 15ms
2026/04/26 09:51:13 1786616953 2caa1e5f [DEBUG Client 443804] Client-Safe Instance ID = 2897386659
2026/04/26 09:51:13 1786616953 2caa22d2 [DEBUG Client 443804] Generating level 4 area "G1_4" with seed 3690647437
2026/04/26 09:51:13 1786617109 f0c29dd3 [INFO Client 443804] Tile hash: 1985582858
2026/04/26 09:51:13 1786617109 f0c29dd2 [INFO Client 443804] Doodad hash: 2117617571
2026/04/26 09:51:13 1786617187 7fbd122e [INFO Client 443804] [SCENE] Set Source [(null)]
2026/04/26 09:51:13 1786617203 7fbd122e [INFO Client 443804] [SCENE] Set Source [The Grelwood]
2026/04/26 09:51:13 1786617375 1a620748 [DEBUG Client 443804] Joined guild named Some guild'e with 97 members
2026/04/26 09:51:58 1786661875 3ef232c2 [INFO Client 443804] : kvanClientLogTestOne (Mercenary) is now level 3
2026/04/26 09:52:05 1786669562 3ef232c2 [INFO Client 443804] : kvanClientLogTestOne has received +10% to [Resistances|Cold Resistance].
2026/04/26 09:52:17 1786681343 2d8e9b94 [DEBUG Client 443804] Got Instance Details from login server
2026/04/26 09:52:17 1786681343 91c6cce [INFO Client 443804] Connecting to instance server at 64.87.51.228:21360
2026/04/26 09:52:17 1786681359 91c63c3 [DEBUG Client 443804] Connect time to instance server was 16ms
2026/04/26 09:52:17 1786681390 2caa1e5f [DEBUG Client 443804] Client-Safe Instance ID = 589094102
2026/04/26 09:52:17 1786681390 2caa22d2 [DEBUG Client 443804] Generating level 6 area "G1_6" with seed 3343635066
2026/04/26 09:52:18 1786681859 f0c29dd3 [INFO Client 443804] Tile hash: 2253829735
2026/04/26 09:52:18 1786681859 f0c29dd2 [INFO Client 443804] Doodad hash: 1491528639
2026/04/26 09:52:18 1786681921 7fbd122e [INFO Client 443804] [SCENE] Set Source [(null)]
2026/04/26 09:52:18 1786681937 7fbd122e [INFO Client 443804] [SCENE] Set Source [The Grim Tangle]
2026/04/26 09:52:18 1786682140 1a620748 [DEBUG Client 443804] Joined guild named Some guild'e with 97 members
2026/04/26 09:52:22 1786686343 2d8e9b94 [DEBUG Client 443804] Got Instance Details from login server
2026/04/26 09:52:22 1786686343 91c6cce [INFO Client 443804] Connecting to instance server at 64.87.51.212:21360
2026/04/26 09:52:22 1786686359 91c63c3 [DEBUG Client 443804] Connect time to instance server was 16ms
2026/04/26 09:52:22 1786686390 2caa1e5f [DEBUG Client 443804] Client-Safe Instance ID = 2897386659
2026/04/26 09:52:22 1786686390 2caa22d2 [DEBUG Client 443804] Generating level 4 area "G1_4" with seed 3690647437
2026/04/26 09:52:22 1786686546 f0c29dd3 [INFO Client 443804] Tile hash: 1985582858
2026/04/26 09:52:22 1786686546 f0c29dd2 [INFO Client 443804] Doodad hash: 2117617571
2026/04/26 09:52:22 1786686625 7fbd122e [INFO Client 443804] [SCENE] Set Source [(null)]
2026/04/26 09:52:22 1786686625 7fbd122e [INFO Client 443804] [SCENE] Set Source [The Grelwood]
2026/04/26 09:52:23 1786686843 1a620748 [DEBUG Client 443804] Joined guild named Some guild'e with 97 members
2026/04/26 09:53:24 1786748515 7fbd122e [INFO Client 443804] [SCENE] Set Source [Act 1]
2026/04/26 09:53:27 1786750890 7fbd122e [INFO Client 443804] [SCENE] Set Source [(null)]
2026/04/26 09:53:27 1786750890 7fbd122e [INFO Client 443804] [SCENE] Set Source [The Grelwood]
2026/04/26 09:54:09 1786793234 2d8e9b94 [DEBUG Client 443804] Got Instance Details from login server
2026/04/26 09:54:09 1786793234 91c6cce [INFO Client 443804] Connecting to instance server at 64.87.51.228:21360
2026/04/26 09:54:09 1786793250 91c63c3 [DEBUG Client 443804] Connect time to instance server was 16ms
2026/04/26 09:54:09 1786793281 2caa1e5f [DEBUG Client 443804] Client-Safe Instance ID = 2177568054
2026/04/26 09:54:09 1786793281 2caa22d2 [DEBUG Client 443804] Generating level 5 area "G1_5" with seed 3701177304
2026/04/26 09:54:09 1786793593 f0c29dd3 [INFO Client 443804] Tile hash: 3011889533
2026/04/26 09:54:09 1786793593 f0c29dd2 [INFO Client 443804] Doodad hash: 1596179686
2026/04/26 09:54:10 1786793656 7fbd122e [INFO Client 443804] [SCENE] Set Source [(null)]
2026/04/26 09:54:10 1786793671 7fbd122e [INFO Client 443804] [SCENE] Set Source [The Red Vale]
2026/04/26 09:54:10 1786793859 1a620748 [DEBUG Client 443804] Joined guild named Some guild'e with 97 members
2026/04/26 09:54:14 1786798484 f4ab5a9a [INFO Client 443804] Successfully allocated passive skill id: projectiles19, name: Projectile Damage
2026/04/26 09:55:16 1786860015 3ef232c2 [INFO Client 443804] : kvanClientLogTestOne (Mercenary) is now level 4
2026/04/26 09:55:49 1786892953 f4ab5a9a [INFO Client 443804] Successfully allocated passive skill id: projectiles20, name: Projectile Damage
2026/04/26 09:56:30 1786934546 3ef232c2 [INFO Client 443804] Ghostly Voice: Our will persists...
2026/04/26 09:57:20 1786983921 3ef232c2 [INFO Client 443804] : kvanClientLogTestOne has been slain.
2026/04/26 09:57:21 1786985234 2d8e9b94 [DEBUG Client 443804] Got Instance Details from login server
2026/04/26 09:57:21 1786985234 91c6cce [INFO Client 443804] Connecting to instance server at 64.87.51.228:21360
2026/04/26 09:57:21 1786985265 91c63c3 [DEBUG Client 443804] Connect time to instance server was 16ms
2026/04/26 09:57:21 1786985281 2caa1e5f [DEBUG Client 443804] Client-Safe Instance ID = 288830972
2026/04/26 09:57:21 1786985281 2caa22d2 [DEBUG Client 443804] Generating level 5 area "G1_5" with seed 3701177304
2026/04/26 09:57:21 1786985406 f0c29dd3 [INFO Client 443804] Tile hash: 3011889533
2026/04/26 09:57:21 1786985406 f0c29dd2 [INFO Client 443804] Doodad hash: 1596179686
2026/04/26 09:57:21 1786985453 7fbd122e [INFO Client 443804] [SCENE] Set Source [(null)]
2026/04/26 09:57:21 1786985468 7fbd122e [INFO Client 443804] [SCENE] Set Source [The Red Vale]
2026/04/26 09:57:22 1786985640 1a620748 [DEBUG Client 443804] Joined guild named Some guild'e with 97 members
2026/04/26 09:57:23 1786987046 3ef232c2 [INFO Client 443804] Ghostly Voice: Our will persists...
2026/04/26 09:57:52 1787016250 3ef232c2 [INFO Client 443804] : kvanClientLogTestOne (Mercenary) is now level 5
2026/04/26 09:58:04 1787028328 f4ab5a9a [INFO Client 443804] Successfully allocated passive skill id: projectiles21_, name: Projectile Damage
2026/04/26 09:58:54 1787078500 3ef232c2 [INFO Client 443804] Ghostly Voice: This is our land, we stand united!
2026/04/26 09:59:18 1787101984 3ef232c2 [INFO Client 443804] The Rust King: Interloper!
2026/04/26 09:59:26 1787110062 3ef232c2 [INFO Client 443804] The Rust King: For the clan!
2026/04/26 09:59:37 1787121156 3ef232c2 [INFO Client 443804] The Rust King: Usurper!
2026/04/26 09:59:50 1787134031 3ef232c2 [INFO Client 443804] The Rust King: For the clan!
2026/04/26 10:00:18 1787162437 4f3e4d2a [INFO Client 443804] Async connecting to dal.login.pathofexile2.com:21262
2026/04/26 10:00:18 1787162453 4f3e4ba7 [INFO Client 443804] Connected to dal.login.pathofexile2.com in 0ms.
2026/04/26 10:00:18 1787162578 7fbd122e [INFO Client 443804] [SCENE] Set Source [(null)]
2026/04/26 10:00:19 1787162640 bdc24083 [INFO Client 443804] [EShop Request] Attempting to request site settings
2026/04/26 10:00:19 1787162796 7fbd122e [INFO Client 443804] [SCENE] Set Source [(unknown)]
2026/04/26 10:00:21 1787165328 7fbd122e [INFO Client 443804] [SCENE] Set Source [(null)]
2026/04/26 10:00:21 1787165343 2d8e9b94 [DEBUG Client 443804] Got Instance Details from login server
2026/04/26 10:00:21 1787165343 91c6cce [INFO Client 443804] Connecting to instance server at 64.87.51.236:21360
2026/04/26 10:00:21 1787165375 91c63c3 [DEBUG Client 443804] Connect time to instance server was 16ms
2026/04/26 10:00:21 1787165375 2caa1e5f [DEBUG Client 443804] Client-Safe Instance ID = 1526874667
2026/04/26 10:00:21 1787165375 2caa22d2 [DEBUG Client 443804] Generating level 15 area "G1_town" with seed 1
2026/04/26 10:00:21 1787165390 8fba9720 [DEBUG Client 443804] [EShop CallForAction] Load starts at 1787165421
2026/04/26 10:00:21 1787165390 8fba870a [WARN Client 443804] [EShop CallForAction] Failed to parse call for action of PaymentPackages
2026/04/26 10:00:21 1787165390 8fba96e6 [DEBUG Client 443804] [EShop CallForAction] Load ends at 1787165421
2026/04/26 10:00:22 1787165625 d7c737f0 [CRIT Client 443804] Unable to load steam stats. Achievements will not work. Error: 2
2026/04/26 10:00:22 1787165734 f0c29dd3 [INFO Client 443804] Tile hash: 892597717
2026/04/26 10:00:22 1787165734 f0c29dd2 [INFO Client 443804] Doodad hash: 2628743579
2026/04/26 10:00:22 1787165843 7fbd122e [INFO Client 443804] [SCENE] Set Source [Clearfell Encampment]
2026/04/26 10:00:22 1787165906 1a620748 [DEBUG Client 443804] Joined guild named Some guild'e with 97 members
2026/04/26 10:00:22 1787166265 3ef232c2 [INFO Client 443804] : You have joined global chat channel 100 English.
2026/04/26 10:00:23 1787167593 bf08f15c [INFO Client 443804] [Item Filter] Preparing to download online filter jeOW68UJ
2026/04/26 10:00:23 1787167593 bf08f196 [INFO Client 443804] [Item Filter] Hash for online filter jeOW68UJ is: 2c868b25951a2502dbc013547e30f29d
2026/04/26 10:00:24 1787167812 bf08f190 [INFO Client 443804] [Item Filter] Online item filter jeOW68UJ returned status: 304
2026/04/26 10:00:24 1787167812 bf08f1fa [DEBUG Client 443804] [Item Filter] Online item filter request resolved to: 2600:1405:e400:3::1737:ec8b
2026/04/26 10:00:24 1787167812 ddd288d2 [INFO Client 443804] [Item Filter] Finished reloading online filter jeOW68UJ. Result: true. Hash: 2c868b25951a2502dbc013547e30f29d. Type: Normal. Message:
2026/04/26 10:00:32 1787176250 3ef232c2 [INFO Client 443804] Renly: Take a look.
2026/04/26 10:00:46 1787189750 3ef232c2 [INFO Client 443804] Renly: I'll find some use for that.
2026/04/26 12:55:28 ***** LOG FILE OPENING *****
2026/04/26 12:55:28 1797671734 84b56f9c [INFO Client 366640] [JOB] Irrecoverable Exception Callback: SET
2026/04/26 12:55:28 1797671843 44e52699 [INFO Client 366640] [CMD][Unrecognized] --nopatch
2026/04/26 12:55:28 1797671843 a1e2d252 [INFO Client 366640] [HTTP2] User agent: PoE poe2_production/tags/4.4.0j Windows x64
2026/04/26 12:55:28 1797671843 a1e2d25d [INFO Client 366640] [HTTP2] Using backend: cURL
2026/04/26 12:55:28 1797671843 84b56fd9 [INFO Client 366640] [JOB] Emulate Platforms: OFF
2026/04/26 12:55:28 1797671843 84b5703f [INFO Client 366640] [JOB] Tight Buffers: ON
2026/04/26 12:55:28 1797671843 84b56bdf [INFO Client 366640] [JOB] Test Many Queues: OFF
2026/04/26 12:55:28 1797671843 84b56f5a [INFO Client 366640] [JOB] Start
2026/04/26 12:55:28 1797671843 84b534d7 [INFO Client 366640] [JOB] HIGH: 8
2026/04/26 12:55:28 1797671843 84b534d7 [INFO Client 366640] [JOB] MEDIUM: 27
2026/04/26 12:55:28 1797671843 84b534d7 [INFO Client 366640] [JOB] LOW: 4
2026/04/26 12:55:28 1797671843 84b534d7 [INFO Client 366640] [JOB] IDLE: 0
2026/04/26 12:55:28 1797671843 aa6e6b49 [INFO Client 366640] [STORAGE] Linearize: OFF
2026/04/26 12:55:28 1797671843 aa6e6b62 [INFO Client 366640] [STORAGE] Mapping bucket count: 8
2026/04/26 12:55:28 1797671843 aa6e6b64 [INFO Client 366640] [STORAGE] Consolidate: OFF
2026/04/26 12:55:28 1797671843 aa6e6bc5 [INFO Client 366640] [STORAGE] Init bundle cache
2026/04/26 12:55:28 1797672281 f6f3c084 [INFO Client 366640] [BUNDLE] Bundle index: Bundles2/_.index.bin
2026/04/26 12:55:28 1797672281 f6f3c083 [INFO Client 366640] [BUNDLE] Found 57648 entries (10.1 MB)
2026/04/26 12:55:28 1797672281 f6f3c082 [INFO Client 366640] [BUNDLE] Found 3481245 slots (66.4 MB)
2026/04/26 12:55:28 1797672281 f6f3c081 [INFO Client 366640] [BUNDLE] Found 86392 directories (1012.4 KB)
2026/04/26 12:55:28 1797672281 aa6e6c04 [INFO Client 366640] [STORAGE] Async: ON
2026/04/26 12:55:28 1797672296 2962e3d6 [INFO Client 366640] [RESOURCE] Jobs: ON
2026/04/26 12:55:28 1797672296 b394a432 [INFO Client 366640] [ENGINE] Build Revision: 304532
2026/04/26 12:55:28 1797672296 b394a3da [INFO Client 366640] [ENGINE] Init
2026/04/26 12:55:28 1797672296 bdfe0c38 [INFO Client 366640] [STARTUP] Registration Start
2026/04/26 12:55:28 1797672296 b394a3db [INFO Client 366640] [ENGINE] Current directory: C:/Program Files (x86)/Steam/steamapps/common/Path of Exile 2
2026/04/26 12:55:28 1797672296 b394a3d8 [INFO Client 366640] [ENGINE] Cache directory: C:\\Users\\kvan\\AppData\\Roaming\\Path of Exile 2\\
2026/04/26 12:55:28 1797672296 b394a3d9 [INFO Client 366640] [ENGINE] Download directory: C:\\Users\\kvan\\AppData\\Roaming\\Path of Exile 2\\Download\\
2026/04/26 12:55:28 1797672296 b394a3de [INFO Client 366640] [ENGINE] Settings directory: C:\\Users\\kvan\\Documents\\My Games\\Path of Exile 2\\
2026/04/26 12:55:28 1797672296 b394a3d3 [INFO Client 366640] [ENGINE] Test Synchronous UI: OFF
2026/04/26 12:55:28 1797672296 b3949f34 [INFO Client 366640] [ENGINE] Test Synchronous Simulation: OFF
2026/04/26 12:55:28 1797672296 b3949f30 [INFO Client 366640] [ENGINE] Test Disable Frame Move Jobs: OFF
2026/04/26 12:55:28 1797672296 b3949f31 [INFO Client 366640] [ENGINE] Test Disable Frame Render Jobs: OFF
2026/04/26 12:55:28 1797672296 b3949f3c [INFO Client 366640] [ENGINE] Linearize: OFF
2026/04/26 12:55:28 1797672296 b335d920 [INFO Client 366640] [RENDER] Render: ON
2026/04/26 12:55:28 1797672296 b335d925 [INFO Client 366640] [RENDER] Emulate: OFF
2026/04/26 12:55:28 1797672296 b335d92a [INFO Client 366640] [RENDER] Tight: ON
2026/04/26 12:55:28 1797672296 b335da0e [INFO Client 366640] [RENDER] Consolidate: OFF
2026/04/26 12:55:28 1797672296 b335da09 [INFO Client 366640] [RENDER] Linearize: OFF
2026/04/26 12:55:28 1797672296 b335da04 [INFO Client 366640] [RENDER] Linearize Textures: OFF
2026/04/26 12:55:28 1797672296 b335da6c [INFO Client 366640] [RENDER] Validate Bindings: OFF
2026/04/26 12:55:28 1797672296 b335da69 [INFO Client 366640] [RENDER] Single Buffered: OFF
2026/04/26 12:55:28 1797672296 b335da6a [INFO Client 366640] [RENDER] Device Recovery: ON
2026/04/26 12:55:28 1797672296 b335d505 [INFO Client 366640] [RENDER] Resource Manager: OFF
2026/04/26 12:55:28 1797672296 b335d502 [INFO Client 366640] [RENDER] Disable Transfer Queue: OFF
2026/04/26 12:55:28 1797672296 6285a3bc [INFO Client 366640] [RENDER] Async: ON
2026/04/26 12:55:28 1797672296 6285a391 [INFO Client 366640] [RENDER] Budget: ON
2026/04/26 12:55:28 1797672296 b335d904 [INFO Client 366640] [RENDER] Wait: ON
2026/04/26 12:55:28 1797672296 b335d902 [INFO Client 366640] [RENDER] Warmup: ON
2026/04/26 12:55:28 1797672296 b335d967 [INFO Client 366640] [RENDER] Skip: ON
2026/04/26 12:55:28 1797672296 b335d96d [INFO Client 366640] [RENDER] Throttling: ON
2026/04/26 12:55:28 1797672296 40326d91 [INFO Client 366640] [SHADER] Packed Only: OFF
2026/04/26 12:55:28 1797672296 40326d94 [INFO Client 366640] [SHADER] Force Compile: OFF
2026/04/26 12:55:28 1797672296 dd2a0f70 [INFO Client 366640] [TEXTURE] Streaming: ON
2026/04/26 12:55:28 1797672296 dd2a0eb2 [INFO Client 366640] [TEXTURE] Budget: ON
2026/04/26 12:55:28 1797672296 dd2a0eb8 [INFO Client 366640] [TEXTURE] Throw: OFF
2026/04/26 12:55:28 1797672296 dd2a0ed7 [INFO Client 366640] [TEXTURE] Upload: ON
2026/04/26 12:55:28 1797672296 dd2a101d [INFO Client 366640] [TEXTURE] Active Always Fits: ON
2026/04/26 12:55:28 1797672296 80ce039a [INFO Client 366640] [MESH] Tight Buffers: ON
2026/04/26 12:55:28 1797672296 80ce0395 [INFO Client 366640] [MESH] Small Caches: OFF
2026/04/26 12:55:28 1797672296 80ce043d [INFO Client 366640] [MESH] Emulate: OFF
2026/04/26 12:55:28 1797672296 80ce039d [INFO Client 366640] [MESH] Dynamic Bucket count: 16
2026/04/26 12:55:28 1797672296 80ce03de [INFO Client 366640] [MESH] Throw: OFF
2026/04/26 12:55:28 1797672296 26280a25 [INFO Client 366640] [ENGINE] Running Engine version 2.6.0
2026/04/26 12:55:28 1797672296 b394971f [INFO Client 366640] [ENGINE] Wiping cache Minimap at C:\\Users\\kvan\\AppData\\Roaming\\Path of Exile 2\\Minimap.tmp
2026/04/26 12:55:28 1797672296 b394971f [INFO Client 366640] [ENGINE] Wiping cache DailyDealCache at C:\\Users\\kvan\\AppData\\Roaming\\Path of Exile 2\\DailyDealCache.tmp
2026/04/26 12:55:28 1797672296 b394971f [INFO Client 366640] [ENGINE] Wiping cache MOTDCache at C:\\Users\\kvan\\AppData\\Roaming\\Path of Exile 2\\MOTDCache.tmp
2026/04/26 12:55:28 1797672296 b394971f [INFO Client 366640] [ENGINE] Wiping cache Countdown at C:\\Users\\kvan\\AppData\\Roaming\\Path of Exile 2\\Countdown.tmp
2026/04/26 12:55:28 1797672296 b394971f [INFO Client 366640] [ENGINE] Wiping cache ShopImages at C:\\Users\\kvan\\AppData\\Roaming\\Path of Exile 2\\ShopImages.tmp
2026/04/26 12:55:28 1797672296 b394971f [INFO Client 366640] [ENGINE] Wiping cache PaymentPackage at C:\\Users\\kvan\\AppData\\Roaming\\Path of Exile 2\\PaymentPackage.tmp
2026/04/26 12:55:28 1797672296 b394971f [INFO Client 366640] [ENGINE] Wiping cache SupporterPackSet at C:\\Users\\kvan\\AppData\\Roaming\\Path of Exile 2\\SupporterPackSet.tmp
2026/04/26 12:55:28 1797672296 b394971f [INFO Client 366640] [ENGINE] Wiping cache VideoCache at C:\\Users\\kvan\\AppData\\Roaming\\Path of Exile 2\\VideoCache.tmp
2026/04/26 12:55:28 1797672296 b394971f [INFO Client 366640] [ENGINE] Wiping cache ShaderCacheNull at C:\\Users\\kvan\\AppData\\Roaming\\Path of Exile 2\\ShaderCacheNull.tmp
2026/04/26 12:55:28 1797672296 b394971f [INFO Client 366640] [ENGINE] Wiping cache ShaderCacheD3D11 at C:\\Users\\kvan\\AppData\\Roaming\\Path of Exile 2\\ShaderCacheD3D11.tmp
2026/04/26 12:55:28 1797672296 b394971f [INFO Client 366640] [ENGINE] Wiping cache ShaderCacheD3D12 at C:\\Users\\kvan\\AppData\\Roaming\\Path of Exile 2\\ShaderCacheD3D12.tmp
2026/04/26 12:55:28 1797672296 b394971f [INFO Client 366640] [ENGINE] Wiping cache ShaderCacheD3D12_X at C:\\Users\\kvan\\AppData\\Roaming\\Path of Exile 2\\ShaderCacheD3D12_X.tmp
2026/04/26 12:55:28 1797672296 b394971f [INFO Client 366640] [ENGINE] Wiping cache ShaderCacheD3D12_XS at C:\\Users\\kvan\\AppData\\Roaming\\Path of Exile 2\\ShaderCacheD3D12_XS.tmp
2026/04/26 12:55:28 1797672296 b394971f [INFO Client 366640] [ENGINE] Wiping cache ShaderCacheGMNX at C:\\Users\\kvan\\AppData\\Roaming\\Path of Exile 2\\ShaderCacheGMNX.tmp
2026/04/26 12:55:28 1797672296 b394971f [INFO Client 366640] [ENGINE] Wiping cache ShaderCacheAGC at C:\\Users\\kvan\\AppData\\Roaming\\Path of Exile 2\\ShaderCacheAGC.tmp
2026/04/26 12:55:28 1797672296 b394971f [INFO Client 366640] [ENGINE] Wiping cache ShaderCacheVulkan at C:\\Users\\kvan\\AppData\\Roaming\\Path of Exile 2\\ShaderCacheVulkan.tmp
2026/04/26 12:55:28 1797672312 d86b4b01 [INFO Client 366640] [TRAILS] Immutable: ON
2026/04/26 12:55:28 1797672312 d86b4b0e [INFO Client 366640] [TRAILS] Debug: OFF
2026/04/26 12:55:28 1797672312 d86b4b24 [INFO Client 366640] [TRAILS] Linearize: OFF
2026/04/26 12:55:28 1797672312 6689d126 [INFO Client 366640] [MAT] Tight: ON
2026/04/26 12:55:28 1797672312 6689d120 [INFO Client 366640] [MAT] Ingore Temp: ON
2026/04/26 12:55:28 1797672312 6689d12d [INFO Client 366640] [MAT] Enable Validation: OFF
2026/04/26 12:55:28 1797672312 6689d0c5 [INFO Client 366640] [MAT] Enable Throw: OFF
2026/04/26 12:55:28 1797672312 6689d0c0 [INFO Client 366640] [MAT] Linearize: OFF
2026/04/26 12:55:28 1797672328 6689d047 [INFO Client 366640] [MAT] Mat table size: 248946.  83817 graph combinations have inlined parameters.  1303750 parameters are inlined.
2026/04/26 12:55:28 1797672328 b18f0f57 [INFO Client 366640] [MAT] Dynamic Bucket count: 8
2026/04/26 12:55:28 1797672328 6689d1ef [INFO Client 366640] [MAT] Async: ON
2026/04/26 12:55:28 1797672328 6689d18a [INFO Client 366640] [MAT] Wait: ON
2026/04/26 12:55:28 1797672328 6689d18c [INFO Client 366640] [MAT] Warmup: ON
2026/04/26 12:55:28 1797672328 80841de1 [INFO Client 366640] [GRAPH] Tight: ON
2026/04/26 12:55:28 1797672328 80841def [INFO Client 366640] [GRAPH] Ignore Temp: ON
2026/04/26 12:55:28 1797672328 104b656a [INFO Client 366640] [SOUND] Audio: ON
2026/04/26 12:55:28 1797672328 80841dc5 [INFO Client 366640] [GRAPH] Inline Uniforms: ON
2026/04/26 12:55:28 1797672328 104b656b [INFO Client 366640] [SOUND] LiveUpdate: OFF
2026/04/26 12:55:28 1797672328 80841dc2 [INFO Client 366640] [GRAPH] Enable Throw: OFF
2026/04/26 12:55:28 1797672328 80841dcf [INFO Client 366640] [GRAPH] Linearize: OFF
2026/04/26 12:55:28 1797672328 4e0deab [INFO Client 366640] [GRAPH] Dynamic Bucket count: 8
2026/04/26 12:55:28 1797672328 f2559bd7 [INFO Client 366640] [VIDEO] Enable: ON
2026/04/26 12:55:28 1797672328 52958d23 [INFO Client 366640] [SOUND] Buffer size = 128.0 MB
2026/04/26 12:55:28 1797672343 529584e0 [INFO Client 366640] [SOUND] Channel count = 128 (asked for 128)
2026/04/26 12:55:28 1797672343 529584e1 [INFO Client 366640] [SOUND] Source count = 512
2026/04/26 12:55:28 1797672375 5295990d [INFO Client 366640] [SOUND] Fmod Init success ( version 0x20311 )
2026/04/26 12:55:28 1797672390 ae8fed80 [INFO Client 366640] [PARTICLE] Immutable: ON
2026/04/26 12:55:28 1797672390 ae8fed85 [INFO Client 366640] [PARTICLE] Debug: OFF
2026/04/26 12:55:28 1797672390 ae8fed86 [INFO Client 366640] [PARTICLE] Keep Persistent: ON
2026/04/26 12:55:28 1797672390 ae8feda0 [INFO Client 366640] [PARTICLE] Linearize: OFF
2026/04/26 12:55:28 1797672390 36ec5eb4 [INFO Client 366640] Enumerated adapter: NVIDIA GeForce RTX 4090
2026/04/26 12:55:28 1797672453 5295a2a8 [INFO Client 366640] [SOUND] Changing to device "Out 1-2 (MOTU M Series)"
2026/04/26 12:55:28 1797672468 bdfe0bdf [INFO Client 366640] [STARTUP] Registration in 0.184729 seconds
2026/04/26 12:55:28 1797672484 36ec5336 [INFO Client 366640] Enumerated device for adapter: NVIDIA GeForce RTX 4090. Selected feature level: 49408. Max feature level: 49408
2026/04/26 12:55:28 1797672484 36ec7d35 [INFO Client 366640] Enumerated output for adapter NVIDIA GeForce RTX 4090 of \\\\.\\DISPLAY3
2026/04/26 12:55:28 1797672484 36ec7d35 [INFO Client 366640] Enumerated output for adapter NVIDIA GeForce RTX 4090 of \\\\.\\DISPLAY1
2026/04/26 12:55:28 1797672484 36ec7d35 [INFO Client 366640] Enumerated output for adapter NVIDIA GeForce RTX 4090 of \\\\.\\DISPLAY2
2026/04/26 12:55:28 1797672484 36ec5eb4 [INFO Client 366640] Enumerated adapter: AMD Radeon(TM) Graphics
2026/04/26 12:55:28 1797672500 36ec5336 [INFO Client 366640] Enumerated device for adapter: AMD Radeon(TM) Graphics. Selected feature level: 49408. Max feature level: 49408
2026/04/26 12:55:28 1797672500 36ec5eb4 [INFO Client 366640] Enumerated adapter: Microsoft Basic Render Driver
2026/04/26 12:55:28 1797672500 36ec5336 [INFO Client 366640] Enumerated device for adapter: Microsoft Basic Render Driver. Selected feature level: 49408. Max feature level: 49408
2026/04/26 12:55:28 1797672531 190bb25d [INFO Client 366640] [RENDER] Driver Version: 32.0.15.8157
2026/04/26 12:55:28 1797672531 190bb252 [INFO Client 366640] [RENDER] Hardware-accelerated GPU scheduling: Enabled
2026/04/26 12:55:28 1797672531 190bb279 [INFO Client 366640] [ENGINE] Windows Version: Windows 10 Build 19045
2026/04/26 12:55:28 1797672531 190bb231 [INFO Client 366640] [ENGINE] OS: Windows 10 Build 19045
2026/04/26 12:55:28 1797672593 3a821288 [INFO Client 366640] [ENGINE] Use Safe Graph: OFF
2026/04/26 12:55:28 1797672593 1dc4a51c [DEBUG Client 366640] Selected XInput.dll is xinput1_4.dll
2026/04/26 12:55:28 1797672609 b394ab70 [INFO Client 366640] [ENGINE] Ready
2026/04/26 12:55:28 1797672609 bdfe0c38 [INFO Client 366640] [STARTUP] Game Start
2026/04/26 12:55:28 1797672609 4915b749 [CRIT Client 366640] Failed to preload UI assets, UI::Core is not initialised yet.
2026/04/26 12:55:29 1797672703 bdfe0c38 [INFO Client 366640] [STARTUP] Device Start
2026/04/26 12:55:29 1797672718 62858759 [INFO Client 366640] [RENDER] Starting device: DirectX12
2026/04/26 12:55:29 1797672718 bdfe0c38 [INFO Client 366640] [STREAMLINE] Init Start
2026/04/26 12:55:30 1797673796 bdfe0bdf [INFO Client 366640] [STREAMLINE] Init in 1.07873 seconds
2026/04/26 12:55:30 1797673796 cb0f8ef6 [INFO Client 366640] [STREAMLINE] Initialized (Enabled)
2026/04/26 12:55:30 1797674015 e0a4d0bb [INFO Client 366640] [D3D12] Found matching adapter using LUID 000003C89C101CF0 (NVIDIA GeForce RTX 4090 - MPG321UR-QD)
2026/04/26 12:55:30 1797674156 bdfe0bdf [INFO Client 366640] [STARTUP] Game in 1.54618 seconds
2026/04/26 12:55:31 1797675562 e0a4d8df [INFO Client 366640] [D3D12] Agility SDK Version = 618
2026/04/26 12:55:31 1797675562 e0a4bc1a [INFO Client 366640] [D3D12] GPU type: discrete (NVidia)
2026/04/26 12:55:31 1797675562 e0a4bc1e [DEBUG Client 366640] [D3D12] VRAM shared = 31.56 GB dedicated = 23.58 GB
2026/04/26 12:55:31 1797675562 e0a4bc1f [INFO Client 366640] [D3D12] VRAM limit: 23.58 GB
2026/04/26 12:55:31 1797675562 e0a4ed77 [INFO Client 366640] [D3D12] Shader Model: D3D_SHADER_MODEL_6_6
2026/04/26 12:55:31 1797675562 e0a4ed11 [INFO Client 366640] [D3D12] Feature Level: 12.1
2026/04/26 12:55:31 1797675562 e0a4e1b8 [INFO Client 366640] [D3D12] Wave Lane Count: 32
2026/04/26 12:55:31 1797675562 e0a4e195 [INFO Client 366640] [D3D12] Transfer Queue Timestamps: true
2026/04/26 12:55:31 1797675562 e0a4e15f [INFO Client 366640] [D3D12] VRS Supported: true (4x4)
2026/04/26 12:55:31 1797675562 e0a4aeb7 [INFO Client 366640] [D3D12] Tight Alignment: true
2026/04/26 12:55:32 1797675671 cb0f9693 [INFO Client 366640] [STREAMLINE][DLSS]: Loaded version 2.4.10 (NGX: 3.7.10)
2026/04/26 12:55:32 1797675671 cb0f9693 [INFO Client 366640] [STREAMLINE][Reflex]: Loaded version 2.4.10 (NGX: 0.0.0)
2026/04/26 12:55:32 1797675671 cb0f9693 [INFO Client 366640] [STREAMLINE][PCL]: Loaded version 2.4.10 (NGX: 0.0.0)
2026/04/26 12:55:32 1797675671 cb0f9752 [INFO Client 366640] [STREAMLINE][NIS]: Loaded proxy version
2026/04/26 12:55:32 1797675671 cb0f9752 [INFO Client 366640] [STREAMLINE][FSR]: Loaded proxy version
2026/04/26 12:55:32 1797675671 cb0f9752 [INFO Client 366640] [STREAMLINE][XeSS]: Loaded proxy version
2026/04/26 12:55:32 1797675671 cb0f9752 [INFO Client 366640] [STREAMLINE][PSSR]: Loaded proxy version
2026/04/26 12:55:32 1797675671 cb0f9771 [INFO Client 366640] [STREAMLINE][DLSS] Enabled: true
2026/04/26 12:55:32 1797675671 4436f5ae [INFO Client 366640] [STREAMLINE][Reflex] Reflex Low Latency: ON
2026/04/26 12:55:32 1797675671 4436f5ad [INFO Client 366640] [STREAMLINE][Reflex] Reflex Flash Indicator: ON
2026/04/26 12:55:32 1797675671 cb0f9771 [INFO Client 366640] [STREAMLINE][Reflex] Enabled: true
2026/04/26 12:55:32 1797675671 cb0f9771 [INFO Client 366640] [STREAMLINE][PCL] Enabled: true
2026/04/26 12:55:32 1797675671 cb0f9771 [INFO Client 366640] [STREAMLINE][NIS] Enabled: true
2026/04/26 12:55:32 1797675671 cb0f977e [INFO Client 366640] [STREAMLINE][FSR] Enabled: true
2026/04/26 12:55:32 1797675703 da2b9991 [INFO Client 366640] [STREAMLINE][XeSS]: Loaded version 2.0.2 (XeFX: 0.0.0)
2026/04/26 12:55:32 1797675703 cb0f977e [INFO Client 366640] [STREAMLINE][XeSS] Enabled: true
2026/04/26 12:55:32 1797675703 cb0f977e [INFO Client 366640] [STREAMLINE][PSSR] Enabled: false
2026/04/26 12:55:32 1797675718 55e61cfc [INFO Client 366640] [D3D12] Buffer Count = 2
2026/04/26 12:55:32 1797675718 3a81fdab [DEBUG Client 366640] [WINDOW] TriggerDeviceCreate
2026/04/26 12:55:32 1797675734 bdc24083 [INFO Client 366640] [EShop Request] Attempting to request site settings
2026/04/26 12:55:32 1797675734 3a81fd4d [DEBUG Client 366640] [WINDOW] TriggerDeviceReset
2026/04/26 12:55:32 1797675750 bdfe0bdf [INFO Client 366640] [STARTUP] Device in 3.05116 seconds
2026/04/26 12:55:32 1797675750 bdfe0c38 [INFO Client 366640] [STARTUP] Tencent Start
2026/04/26 12:55:32 1797675750 bdfe0bdf [INFO Client 366640] [STARTUP] Tencent in 8e-06 seconds
2026/04/26 12:55:32 1797675750 bdfe0c38 [INFO Client 366640] [STARTUP] None Start
2026/04/26 12:55:32 1797675750 bdfe0bdf [INFO Client 366640] [STARTUP] None in 8e-06 seconds
2026/04/26 12:55:32 1797675750 bdfe0c38 [INFO Client 366640] [STARTUP] Loading Start
2026/04/26 12:55:32 1797675765 bdfe0bdf [INFO Client 366640] [STARTUP] Loading in 0.014254 seconds
2026/04/26 12:55:32 1797675765 bdfe0c38 [INFO Client 366640] [STARTUP] DebugGUI Start
2026/04/26 12:55:32 1797675765 bdfe0bdf [INFO Client 366640] [STARTUP] DebugGUI in 9e-06 seconds
2026/04/26 12:55:32 1797675781 7fbd122e [INFO Client 366640] [SCENE] Set Source [(unknown)]
2026/04/26 12:55:32 1797675875 b394b073 [INFO Client 366640] [ENGINE] Reset static
2026/04/26 12:55:35 1797679500 64a60fe5 [WARN Client 366640] Failed to create effect graph node (ID: 1428025895). Node type does not exist
2026/04/26 12:55:35 1797679500 35d98e36 [WARN Client 366640] Failed to create effect graph node "VertexFlipBookOffset" in graph "Metadata/Effects/Graphs/General/FlipbookOld.fxgraph"
2026/04/26 12:55:37 1797680984 4f3e4d2a [INFO Client 366640] Async connecting to dal.login.pathofexile2.com:21262
2026/04/26 12:55:37 1797681000 4f3e4ba7 [INFO Client 366640] Connected to dal.login.pathofexile2.com in 0ms.
2026/04/26 12:55:50 1797694062 7fbd122e [INFO Client 366640] [SCENE] Set Source [(null)]
2026/04/26 12:55:50 1797694062 2d8e9b94 [DEBUG Client 366640] Got Instance Details from login server
2026/04/26 12:55:50 1797694078 91c6cce [INFO Client 366640] Connecting to instance server at 64.87.51.236:21360
2026/04/26 12:55:50 1797694093 91c63c3 [DEBUG Client 366640] Connect time to instance server was 0ms
2026/04/26 12:55:50 1797694125 2caa1e5f [DEBUG Client 366640] Client-Safe Instance ID = 3821972762
2026/04/26 12:55:50 1797694125 2caa22d2 [DEBUG Client 366640] Generating level 15 area "G1_town" with seed 1
2026/04/26 12:55:50 1797694156 8fba9720 [DEBUG Client 366640] [EShop CallForAction] Load starts at 1797694188
2026/04/26 12:55:50 1797694156 8fba870a [WARN Client 366640] [EShop CallForAction] Failed to parse call for action of PaymentPackages
2026/04/26 12:55:50 1797694156 8fba96e6 [DEBUG Client 366640] [EShop CallForAction] Load ends at 1797694188
2026/04/26 12:55:50 1797694500 d7c737f0 [CRIT Client 366640] Unable to load steam stats. Achievements will not work. Error: 2
2026/04/26 12:55:50 1797694625 f0c29dd3 [INFO Client 366640] Tile hash: 892597717
2026/04/26 12:55:50 1797694625 f0c29dd2 [INFO Client 366640] Doodad hash: 2628743579
2026/04/26 12:55:51 1797694734 7fbd122e [INFO Client 366640] [SCENE] Set Source [Clearfell Encampment]
2026/04/26 12:55:51 1797694812 1a620748 [DEBUG Client 366640] Joined guild named Woolie's UNGA BUNGAS with 97 members
2026/04/26 12:55:51 1797694828 1a62038d [DEBUG Client 366640] InstanceClientSetSelfPartyInvitationSecurityCode = 0
2026/04/26 12:55:51 1797695062 7b991246 [INFO Client 366640] [EShop Request] Attempting to request shop resources
2026/04/26 12:55:51 1797695390 3ef232c2 [INFO Client 366640] : You have joined global chat channel 100 English.
2026/04/26 12:55:51 1797695390 3ef232c2 [INFO Client 366640] : You have joined trade chat channel 820 English.
2026/04/26 12:56:00 1797704171 3ef232c2 [INFO Client 366640] &: GUILD UPDATE: M E L E E
2026/04/26 12:56:00 1797704312 bf08f15c [INFO Client 366640] [Item Filter] Preparing to download online filter jeOW68UJ
2026/04/26 12:56:00 1797704312 bf08f196 [INFO Client 366640] [Item Filter] Hash for online filter jeOW68UJ is: 2c868b25951a2502dbc013547e30f29d
2026/04/26 12:56:00 1797704500 bf08f190 [INFO Client 366640] [Item Filter] Online item filter jeOW68UJ returned status: 304
2026/04/26 12:56:00 1797704500 bf08f1fa [DEBUG Client 366640] [Item Filter] Online item filter request resolved to: 2600:1405:e400:3::1737:ec8b
2026/04/26 12:56:00 1797704500 ddd288d2 [INFO Client 366640] [Item Filter] Finished reloading online filter jeOW68UJ. Result: true. Hash: 2c868b25951a2502dbc013547e30f29d. Type: Normal. Message:
2026/04/26 12:56:00 1797704500 d4f84d48 [INFO Client 366640] PrecalcBaseTypeHashMap
2026/04/26 12:56:00 1797704515 d4f84d4a [INFO Client 366640] PrecalcModNameHashMap
2026/04/26 12:56:00 1797704546 d4f84d44 [INFO Client 366640] PrecalcItemClassMap
2026/04/26 12:56:00 1797704546 d4f84d6d [INFO Client 366640] PrecalcSoundEffects
2026/04/26 12:56:00 1797704546 d4f84d6f [INFO Client 366640] PrecalcDropEffects
2026/04/26 12:56:00 1797704546 d4f84d69 [INFO Client 366640] PrecalcNonEnchantModHashes
2026/04/26 12:56:00 1797704546 d4f84d6b [INFO Client 366640] PrecalcRuleNameToTypeMap
2026/04/26 12:56:00 1797704546 d4f84d65 [INFO Client 366640] PrecalcCJESPNIndexMap
2026/04/26 12:56:00 1797704546 d4f84c02 [INFO Client 366640] PrecalcTransfiguredGemsIndexMap
2026/04/26 12:56:06 1797709765 7fbd122e [INFO Client 366640] [SCENE] Set Source [Act 1]
2026/04/26 12:56:22 1797726437 f4ab5af9 [INFO Client 366640] Successfully unallocated passive skill id: elemental8_, name: Elemental Damage
2026/04/26 12:56:41 1797745406 f4ab5a9a [INFO Client 366640] Successfully allocated passive skill id: elemental8_, name: Elemental Damage
`;

describe("clientLog", () => {
  beforeEach(async () => {
    setupTests();
    await init("en");
    vi.clearAllMocks();
  });

  it("should parse", () => {
    const { handleLine } = useClientLog();

    for (const line of log1.split("\n")) {
      expect(() => {
        handleLine(line);
      }).not.toThrow();
    }
  });
});

describe("local performance tests", () => {
  let lines: string[] = [];

  beforeEach(() => {
    const blob = readFileSync(
      "C:/Program Files (x86)/Steam/steamapps/common/Path of Exile 2/logs/Client.txt",
    );
    lines = blob.toString().split("\n");
  });

  it("slice", { timeout: 0, skip: true }, () => {
    for (const line of lines) {
      const splat1 = line.split("] ");
      const splat2 = splat1.shift()?.split(" ");
      const message = splat1.join("] ");
      const date = splat2?.shift();
      const time = splat2?.shift();
      const millis = splat2?.shift();
      if ((!date || !time || !millis) && message) {
        throw new Error(`Failed to parse line: ${line}`);
      }
    }
  });
  const logRegex =
    /^(?<date>\d{4}\/\d{2}\/\d{2}) (?<time>\d{2}:\d{2}:\d{2}) (?<millis>\d+) .*\] (?<message>.*)$/;
  it("regex", { timeout: 0, skip: true }, () => {
    for (const line of lines) {
      const match = line.match(logRegex);
      if (!match) {
        continue;
      }
      const { date, time, millis, message } = match.groups!;
      if ((!date || !time || !millis) && message) {
        throw new Error(`Failed to parse line: ${line}`);
      }
    }
  });
});
