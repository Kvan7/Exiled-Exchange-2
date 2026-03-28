---
title: Item Data
---

Helps to collect data on crafting results of items.

![Single Item Rolling UI](/reference-images/SingleItemRollingUI.png)

The name shown will be the csv file name, above it would be `mySession.csv`. Pressing the play button will start the session, creating the file, if it doesn't exist yet. Data will be written to the file for each roll, stopping the "session" doesn't really do much. The count of rolls is shown along with the latest modifiers name.

## Activation

To enable, Experimental features must be enabled in the "General" tab of the settings then enable "Item Data Collection"

![Experimental features](/reference-images/expFeatures.png)

The widget will then appear on the main overlay UI as a book icon. Clicking it will open the widget.

![widget icon](/reference-images/libraryWidgetIcon.png)

## Settings

Settings can be accessed via clicking edit on the side of the widget

![edit widget](/reference-images/editWidget.png)

![Single Item Rolling Settings](/reference-images/LibrarySettings.png)

The key used to log the item is configurable & the folder the csv files are saved to.

**Note:** It is recommended to use a keybind that includes the `Shift` key to allow continuous use of crafting currency.

## CSV Format

The csv file is a comma separated file with the following columns:

| Column Name   | Description                                             |
| ------------- | ------------------------------------------------------- |
| `base`        | Item base type                                          |
| `ilvl`        | Item level                                              |
| `rarity`      | Item rarity                                             |
| `sockets`     | Sockets on the item                                     |
| `mods`        | List of all modifiers on the item                       |
| `addedMods`   | List of modifiers added from the previous item stored   |
| `removedMods` | List of modifiers removed from the previous item stored |

### Modifier JSON Format

Lists of modifiers will all be lists of json objects of the following interface:

```ts
interface Mod {
  name: string;
  tier: number;
  roll: number[];
  ref: string[];
  type: string;
}
```

## Example Data

Below is a sample of possible data:

```csv
base,ilvl,rarity,sockets,mods,addedMods,removedMods
Precursor Tablet,80,Rare,0,"[{'name':'Collector\'s','tier':1,'roll':[25],'ref':['#% increased Rarity of Items found in your Maps'],'type':'explicit'}]","[{'name':'Collector\'s','tier':1,'roll':[25],'ref':['#% increased Rarity of Items found in your Maps'],'type':'explicit'}]","[]"
Precursor Tablet,80,Rare,0,"[{'name':'Elevated','tier':1,'roll':[16],'ref':['#% increased Experience gain'],'type':'explicit'}]","[{'name':'Elevated','tier':1,'roll':[16],'ref':['#% increased Experience gain'],'type':'explicit'}]","[{'name':'Collector\'s','tier':1,'roll':[25],'ref':['#% increased Rarity of Items found in your Maps'],'type':'explicit'}]"
Precursor Tablet,80,Rare,0,"[{'name':'Bountiful','tier':1,'roll':[39],'ref':['#% increased Gold found in your Maps'],'type':'explicit'}]","[{'name':'Bountiful','tier':1,'roll':[39],'ref':['#% increased Gold found in your Maps'],'type':'explicit'}]","[{'name':'Elevated','tier':1,'roll':[16],'ref':['#% increased Experience gain'],'type':'explicit'}]"
Precursor Tablet,80,Rare,0,"[{'name':'Bountiful','tier':1,'roll':[33],'ref':['#% increased Gold found in your Maps'],'type':'explicit'}]","[{'name':'Bountiful','tier':1,'roll':[33],'ref':['#% increased Gold found in your Maps'],'type':'explicit'}]","[{'name':'Bountiful','tier':1,'roll':[39],'ref':['#% increased Gold found in your Maps'],'type':'explicit'}]"
Precursor Tablet,80,Rare,0,"[{'name':'of the Essence','tier':1,'roll':[92],'ref':['Your Maps have #% increased chance to contain Essences'],'type':'explicit'}]","[{'name':'of the Essence','tier':1,'roll':[92],'ref':['Your Maps have #% increased chance to contain Essences'],'type':'explicit'}]","[{'name':'Bountiful','tier':1,'roll':[33],'ref':['#% increased Gold found in your Maps'],'type':'explicit'}]"
Precursor Tablet,80,Rare,0,"[{'name':'Treasurer\'s','tier':1,'roll':[3],'ref':['Your Maps contain an additional Rare Chest'],'type':'explicit'}]","[{'name':'Treasurer\'s','tier':1,'roll':[3],'ref':['Your Maps contain an additional Rare Chest'],'type':'explicit'}]","[{'name':'of the Essence','tier':1,'roll':[92],'ref':['Your Maps have #% increased chance to contain Essences'],'type':'explicit'}]"
Precursor Tablet,80,Rare,0,"[{'name':'Collector\'s','tier':1,'roll':[26],'ref':['#% increased Rarity of Items found in your Maps'],'type':'explicit'}]","[{'name':'Collector\'s','tier':1,'roll':[26],'ref':['#% increased Rarity of Items found in your Maps'],'type':'explicit'}]","[{'name':'Treasurer\'s','tier':1,'roll':[3],'ref':['Your Maps contain an additional Rare Chest'],'type':'explicit'}]"
Precursor Tablet,80,Rare,0,"[{'name':'of the Cartographer','tier':1,'roll':[48],'ref':['#% increased Quantity of Waystones found in your Maps'],'type':'explicit'}]","[{'name':'of the Cartographer','tier':1,'roll':[48],'ref':['#% increased Quantity of Waystones found in your Maps'],'type':'explicit'}]","[{'name':'Collector\'s','tier':1,'roll':[26],'ref':['#% increased Rarity of Items found in your Maps'],'type':'explicit'}]"
Precursor Tablet,80,Rare,0,"[{'name':'of Undertaking','tier':1,'roll':[1],'ref':['Your Maps have # additional random Modifier'],'type':'explicit'}]","[{'name':'of Undertaking','tier':1,'roll':[1],'ref':['Your Maps have # additional random Modifier'],'type':'explicit'}]","[{'name':'of the Cartographer','tier':1,'roll':[48],'ref':['#% increased Quantity of Waystones found in your Maps'],'type':'explicit'}]"
Precursor Tablet,80,Rare,0,"[{'name':'Bountiful','tier':1,'roll':[35],'ref':['#% increased Gold found in your Maps'],'type':'explicit'}]","[{'name':'Bountiful','tier':1,'roll':[35],'ref':['#% increased Gold found in your Maps'],'type':'explicit'}]","[{'name':'of Undertaking','tier':1,'roll':[1],'ref':['Your Maps have # additional random Modifier'],'type':'explicit'}]"
Precursor Tablet,80,Rare,0,"[{'name':'Brimming','tier':1,'roll':[40],'ref':['#% increased number of Rare Monsters'],'type':'explicit'}]","[{'name':'Brimming','tier':1,'roll':[40],'ref':['#% increased number of Rare Monsters'],'type':'explicit'}]","[{'name':'Bountiful','tier':1,'roll':[35],'ref':['#% increased Gold found in your Maps'],'type':'explicit'}]"
```

Below is a sample of data that has some edge cases, like no mods, multiple mods removed, multiple mods added, many mods changed in one turn, etc. This is not comprehensive, for all edge cases, like changing the item itself.

```csv
base,ilvl,rarity,sockets,mods,addedMods,removedMods
Precursor Tablet,80,Rare,0,"[{'name':'of Shrines','tier':1,'roll':[94],'ref':['Your Maps have #% increased chance to contain Shrines'],'type':'explicit'}]","[{'name':'of Shrines','tier':1,'roll':[94],'ref':['Your Maps have #% increased chance to contain Shrines'],'type':'explicit'}]","[]"
Precursor Tablet,80,Rare,0,"[{'name':'Challenger\'s','tier':1,'roll':[7],'ref':['#% increased Effectiveness of Monsters in your Maps'],'type':'explicit'}]","[{'name':'Challenger\'s','tier':1,'roll':[7],'ref':['#% increased Effectiveness of Monsters in your Maps'],'type':'explicit'}]","[{'name':'of Shrines','tier':1,'roll':[94],'ref':['Your Maps have #% increased chance to contain Shrines'],'type':'explicit'}]"
Precursor Tablet,80,Rare,0,"[{'name':'Elevated','tier':1,'roll':[20],'ref':['#% increased Experience gain'],'type':'explicit'}]","[{'name':'Elevated','tier':1,'roll':[20],'ref':['#% increased Experience gain'],'type':'explicit'}]","[{'name':'Challenger\'s','tier':1,'roll':[7],'ref':['#% increased Effectiveness of Monsters in your Maps'],'type':'explicit'}]"
Precursor Tablet,80,Rare,0,"[{'name':'Brimming','tier':1,'roll':[33],'ref':['#% increased number of Rare Monsters'],'type':'explicit'}]","[{'name':'Brimming','tier':1,'roll':[33],'ref':['#% increased number of Rare Monsters'],'type':'explicit'}]","[{'name':'Elevated','tier':1,'roll':[20],'ref':['#% increased Experience gain'],'type':'explicit'}]"
Precursor Tablet,80,Rare,0,"[{'name':'Bountiful','tier':1,'roll':[34],'ref':['#% increased Gold found in your Maps'],'type':'explicit'}]","[{'name':'Bountiful','tier':1,'roll':[34],'ref':['#% increased Gold found in your Maps'],'type':'explicit'}]","[{'name':'Brimming','tier':1,'roll':[33],'ref':['#% increased number of Rare Monsters'],'type':'explicit'}]"
Precursor Tablet,80,Rare,0,"[{'name':'Bountiful','tier':1,'roll':[28],'ref':['#% increased Gold found in your Maps'],'type':'explicit'}]","[{'name':'Bountiful','tier':1,'roll':[28],'ref':['#% increased Gold found in your Maps'],'type':'explicit'}]","[{'name':'Bountiful','tier':1,'roll':[34],'ref':['#% increased Gold found in your Maps'],'type':'explicit'}]"
Precursor Tablet,80,Rare,0,"[{'name':'Bountiful','tier':1,'roll':[30],'ref':['#% increased Gold found in your Maps'],'type':'explicit'}]","[{'name':'Bountiful','tier':1,'roll':[30],'ref':['#% increased Gold found in your Maps'],'type':'explicit'}]","[{'name':'Bountiful','tier':1,'roll':[28],'ref':['#% increased Gold found in your Maps'],'type':'explicit'}]"
Precursor Tablet,80,Rare,0,"[{'name':'of the Cartographer','tier':1,'roll':[50],'ref':['#% increased Quantity of Waystones found in your Maps'],'type':'explicit'}]","[{'name':'of the Cartographer','tier':1,'roll':[50],'ref':['#% increased Quantity of Waystones found in your Maps'],'type':'explicit'}]","[{'name':'Bountiful','tier':1,'roll':[30],'ref':['#% increased Gold found in your Maps'],'type':'explicit'}]"
Precursor Tablet,80,Rare,0,"[{'name':'Collector\'s','tier':1,'roll':[30],'ref':['#% increased Rarity of Items found in your Maps'],'type':'explicit'}]","[{'name':'Collector\'s','tier':1,'roll':[30],'ref':['#% increased Rarity of Items found in your Maps'],'type':'explicit'}]","[{'name':'of the Cartographer','tier':1,'roll':[50],'ref':['#% increased Quantity of Waystones found in your Maps'],'type':'explicit'}]"
Precursor Tablet,80,Rare,0,"[{'name':'Treasurer\'s','tier':1,'roll':[3],'ref':['Your Maps contain an additional Rare Chest'],'type':'explicit'}]","[{'name':'Treasurer\'s','tier':1,'roll':[3],'ref':['Your Maps contain an additional Rare Chest'],'type':'explicit'}]","[{'name':'Collector\'s','tier':1,'roll':[30],'ref':['#% increased Rarity of Items found in your Maps'],'type':'explicit'}]"
Precursor Tablet,80,Rare,0,"[{'name':'Elevated','tier':1,'roll':[20],'ref':['#% increased Experience gain'],'type':'explicit'}]","[{'name':'Elevated','tier':1,'roll':[20],'ref':['#% increased Experience gain'],'type':'explicit'}]","[{'name':'Treasurer\'s','tier':1,'roll':[3],'ref':['Your Maps contain an additional Rare Chest'],'type':'explicit'}]"
Precursor Tablet,80,Rare,0,"[{'name':'Elevated','tier':1,'roll':[20],'ref':['#% increased Experience gain'],'type':'explicit'},{'name':'Challenger\'s','tier':1,'roll':[10],'ref':['#% increased Effectiveness of Monsters in your Maps'],'type':'explicit'}]","[{'name':'Challenger\'s','tier':1,'roll':[10],'ref':['#% increased Effectiveness of Monsters in your Maps'],'type':'explicit'}]","[]"
Precursor Tablet,80,Rare,0,"[{'name':'Breeding','tier':1,'roll':[8],'ref':['#% increased Pack Size in your Maps'],'type':'explicit'},{'name':'Challenger\'s','tier':1,'roll':[8],'ref':['#% increased Effectiveness of Monsters in your Maps'],'type':'explicit'}]","[{'name':'Breeding','tier':1,'roll':[8],'ref':['#% increased Pack Size in your Maps'],'type':'explicit'},{'name':'Challenger\'s','tier':1,'roll':[8],'ref':['#% increased Effectiveness of Monsters in your Maps'],'type':'explicit'}]","[{'name':'Elevated','tier':1,'roll':[20],'ref':['#% increased Experience gain'],'type':'explicit'},{'name':'Challenger\'s','tier':1,'roll':[10],'ref':['#% increased Effectiveness of Monsters in your Maps'],'type':'explicit'}]"
Precursor Tablet,80,Rare,0,"[{'name':'Bountiful','tier':1,'roll':[28],'ref':['#% increased Gold found in your Maps'],'type':'explicit'},{'name':'Teeming','tier':1,'roll':[57],'ref':['#% increased Magic Monsters'],'type':'explicit'}]","[{'name':'Bountiful','tier':1,'roll':[28],'ref':['#% increased Gold found in your Maps'],'type':'explicit'},{'name':'Teeming','tier':1,'roll':[57],'ref':['#% increased Magic Monsters'],'type':'explicit'}]","[{'name':'Breeding','tier':1,'roll':[8],'ref':['#% increased Pack Size in your Maps'],'type':'explicit'},{'name':'Challenger\'s','tier':1,'roll':[8],'ref':['#% increased Effectiveness of Monsters in your Maps'],'type':'explicit'}]"
Precursor Tablet,80,Rare,0,"[{'name':'Teeming','tier':1,'roll':[70],'ref':['#% increased Magic Monsters'],'type':'explicit'},{'name':'of the Antiquarian','tier':1,'roll':[1],'ref':['Your Maps contain # additional Strongboxes'],'type':'explicit'}]","[{'name':'Teeming','tier':1,'roll':[70],'ref':['#% increased Magic Monsters'],'type':'explicit'},{'name':'of the Antiquarian','tier':1,'roll':[1],'ref':['Your Maps contain # additional Strongboxes'],'type':'explicit'}]","[{'name':'Bountiful','tier':1,'roll':[28],'ref':['#% increased Gold found in your Maps'],'type':'explicit'},{'name':'Teeming','tier':1,'roll':[57],'ref':['#% increased Magic Monsters'],'type':'explicit'}]"
Precursor Tablet,80,Rare,0,"[{'name':'of the Antiquarian','tier':1,'roll':[1],'ref':['Your Maps contain # additional Strongboxes'],'type':'explicit'}]","[]","[{'name':'Teeming','tier':1,'roll':[70],'ref':['#% increased Magic Monsters'],'type':'explicit'}]"
Precursor Tablet,80,Rare,0,"[{'name':'Challenger\'s','tier':1,'roll':[11],'ref':['#% increased Effectiveness of Monsters in your Maps'],'type':'explicit'}]","[{'name':'Challenger\'s','tier':1,'roll':[11],'ref':['#% increased Effectiveness of Monsters in your Maps'],'type':'explicit'}]","[{'name':'of the Antiquarian','tier':1,'roll':[1],'ref':['Your Maps contain # additional Strongboxes'],'type':'explicit'}]"
Precursor Tablet,80,Rare,0,"[{'name':'of the Summoning','tier':1,'roll':[49],'ref':['Area has #% increased chance to contain a Summoning Circle'],'type':'explicit'}]","[{'name':'of the Summoning','tier':1,'roll':[49],'ref':['Area has #% increased chance to contain a Summoning Circle'],'type':'explicit'}]","[{'name':'Challenger\'s','tier':1,'roll':[11],'ref':['#% increased Effectiveness of Monsters in your Maps'],'type':'explicit'}]"
Precursor Tablet,80,Rare,0,"[{'name':'of the Summoning','tier':1,'roll':[42],'ref':['Area has #% increased chance to contain a Summoning Circle'],'type':'explicit'}]","[{'name':'of the Summoning','tier':1,'roll':[42],'ref':['Area has #% increased chance to contain a Summoning Circle'],'type':'explicit'}]","[{'name':'of the Summoning','tier':1,'roll':[49],'ref':['Area has #% increased chance to contain a Summoning Circle'],'type':'explicit'}]"
Precursor Tablet,80,Rare,0,"[{'name':'Challenger\'s','tier':1,'roll':[9],'ref':['#% increased Effectiveness of Monsters in your Maps'],'type':'explicit'},{'name':'Collector\'s','tier':1,'roll':[23],'ref':['#% increased Rarity of Items found in your Maps'],'type':'explicit'},{'name':'of the Summoning','tier':1,'roll':[42],'ref':['Area has #% increased chance to contain a Summoning Circle'],'type':'explicit'},{'name':'of the Cartographer','tier':1,'roll':[44],'ref':['#% increased Quantity of Waystones found in your Maps'],'type':'explicit'}]","[{'name':'Challenger\'s','tier':1,'roll':[9],'ref':['#% increased Effectiveness of Monsters in your Maps'],'type':'explicit'},{'name':'Collector\'s','tier':1,'roll':[23],'ref':['#% increased Rarity of Items found in your Maps'],'type':'explicit'},{'name':'of the Cartographer','tier':1,'roll':[44],'ref':['#% increased Quantity of Waystones found in your Maps'],'type':'explicit'}]","[]"
Precursor Tablet,80,Rare,0,"[]","[]","[{'name':'Challenger\'s','tier':1,'roll':[9],'ref':['#% increased Effectiveness of Monsters in your Maps'],'type':'explicit'},{'name':'Collector\'s','tier':1,'roll':[23],'ref':['#% increased Rarity of Items found in your Maps'],'type':'explicit'},{'name':'of the Summoning','tier':1,'roll':[42],'ref':['Area has #% increased chance to contain a Summoning Circle'],'type':'explicit'},{'name':'of the Cartographer','tier':1,'roll':[44],'ref':['#% increased Quantity of Waystones found in your Maps'],'type':'explicit'}]"
Precursor Tablet,80,Rare,0,"[{'name':'of the Devoted','tier':1,'roll':[1],'ref':['Your Maps contain an additional Shrine'],'type':'explicit'}]","[{'name':'of the Devoted','tier':1,'roll':[1],'ref':['Your Maps contain an additional Shrine'],'type':'explicit'}]","[]"
Precursor Tablet,80,Rare,0,"[{'name':'Collector\'s','tier':1,'roll':[25],'ref':['#% increased Rarity of Items found in your Maps'],'type':'explicit'}]","[{'name':'Collector\'s','tier':1,'roll':[25],'ref':['#% increased Rarity of Items found in your Maps'],'type':'explicit'}]","[{'name':'of the Devoted','tier':1,'roll':[1],'ref':['Your Maps contain an additional Shrine'],'type':'explicit'}]"
Precursor Tablet,80,Rare,0,"[{'name':'Collector\'s','tier':1,'roll':[25],'ref':['#% increased Rarity of Items found in your Maps'],'type':'explicit'}]","[]","[]"
Precursor Tablet,80,Rare,0,"[{'name':'Collector\'s','tier':1,'roll':[25],'ref':['#% increased Rarity of Items found in your Maps'],'type':'explicit'}]","[]","[]"
```

A larger scale sample(1k) can be found in [LargeDemo.csv](https://raw.githubusercontent.com/Kvan7/Exiled-Exchange-2/refs/heads/master/docs/.vitepress/LargeDemo.csv)
