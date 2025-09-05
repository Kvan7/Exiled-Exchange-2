# Grinding Gear Games Terms of Service Compliance

This document outlines how Exiled Exchange 2 complies with Grinding Gear Games' Terms of Service for Path of Exile 2.

## Compliance Overview

Exiled Exchange 2 is designed to be **fully compliant** with GGG's Terms of Service and third-party application policies.

### ✅ What We DO (Allowed)

1. **Overlay Interface**: Non-intrusive price checking overlay that runs separately from the game
2. **Official API Usage**: Uses official Path of Exile trade API with proper rate limiting
3. **Manual Data Entry**: All item data is manually researched and entered from public sources
4. **Community Sourcing**: Data gathered from community wikis, official announcements, and public resources
5. **No Game Modification**: Zero interaction with game files, memory, or client data

### ❌ What We DON'T DO (Prohibited)

1. **Game Client Modification**: We never touch game files or modify the game client
2. **Memory Reading**: No reading from game memory or process injection
3. **Data Mining**: No extraction of data directly from GGG's systems
4. **API Abuse**: Strict adherence to API rate limits and usage policies
5. **Unfair Advantages**: No automation, macros, or gameplay advantages
6. **Commercial Exploitation**: No selling of GGG's intellectual property

## Data Sources (Compliant)

All item data in Exiled Exchange 2 comes from **publicly available, community-generated sources**:

### Primary Sources
- **Community Wikis**: poe2db.tw, Game8.co, pathofexile2.wiki.fextralife.com
- **Community Tools**: mobalytics.gg, maxroll.gg, poe-vault.com
- **Official Announcements**: Patch notes and developer posts
- **Player Community**: Forums, Reddit, Discord discussions

### Rise of the Abyssal Data Sources
- **Manual Research**: All new league content manually researched and documented
- **Community Documentation**: Wikis and community sites documenting new items
- **Official Patch Notes**: Information from official GGG announcements
- **Attribution**: Full source attribution included in data files

## Technical Compliance Measures

### API Usage
- **Rate Limiting**: Implemented to prevent excessive API calls
- **Caching**: Data cached locally to minimize API requests
- **Error Handling**: Graceful handling of API failures and limits
- **User Agent**: Proper identification in API requests

### Data Processing
```bash
# Example of compliant data structure
# All data manually entered, not extracted from game client
dataParser/vendor/client/overrideData/rise_of_abyssal_data.txt
```

### Code Comments
```javascript
// Compliant price checking - uses official trade API only
// No game client interaction or memory reading
// Rate limited to respect GGG's servers
```

## Historical Context

### Policy Precedents
- **PoE Overlay**: Similar tools exist and are tolerated when following guidelines
- **Community Tools**: Established ecosystem of third-party tools
- **Official Recognition**: GGG provides APIs for legitimate third-party use

### Compliance History
- **No Client Modification**: Tool runs completely separate from game
- **API Respectful**: Uses official endpoints with appropriate limits
- **Community Benefit**: Enhances player experience without unfair advantages

## Risk Mitigation

### Proactive Measures
1. **Documentation**: Clear documentation of compliance measures
2. **Source Attribution**: All data sources properly credited
3. **Update Monitoring**: Regular review of GGG policy changes
4. **Community Feedback**: Responsive to policy concerns

### Contingency Plans
1. **Data Removal**: Ability to quickly remove data if requested
2. **API Adjustment**: Flexible rate limiting configuration
3. **Feature Modification**: Can disable features if policy changes
4. **Communication**: Direct line for GGG communication if needed

## Legal Disclaimers

### Trademark Acknowledgment
- Path of Exile 2 is a trademark of Grinding Gear Games
- Exiled Exchange 2 is not affiliated with or endorsed by GGG
- All game data and imagery belongs to Grinding Gear Games

### Fair Use
- Educational and informational use of publicly available data
- No commercial exploitation of GGG's intellectual property
- Community tool enhancing legitimate gameplay

### User Responsibility
- Users responsible for their own account safety
- Tool provided "as-is" without warranties
- Users should review GGG's ToS independently

## Contact Information

For compliance questions or concerns:
- **GitHub Issues**: https://github.com/rduffyuk/Exiled-Exchange-2/issues
- **Community Discussion**: Path of Exile 2 subreddit and forums
- **Policy Updates**: Monitor GGG announcements for policy changes

## Version History

- **2025-01-04**: Initial compliance documentation
- **2025-01-04**: Rise of the Abyssal integration with full compliance
- **Future**: Regular updates as policies evolve

---

*This document is maintained to ensure ongoing compliance with Grinding Gear Games' Terms of Service. It will be updated as policies evolve.*