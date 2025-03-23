---
title: Stash Search
---

Save text to use for searching in the stash or vendors. You can also bind keybinds to these. While not affiliated, [poe2.re](https://poe2.re/waystone) is extremely useful for generating regexes for various things you want to search for. Check out the [PoE Wiki](https://www.poewiki.net/wiki/Guide:Regex) for more information on PoE's version of Regex.

To open the widget, press `Shift + Space` and then click either "Dump sorting" or "Map rolling" in the overlay. These are two Preset widgets but they can be customized to your liking. You can add as many of these widgets as you want, so do not feel limited by the presets.

![Add search](/reference-images/StashSearchAdd.png)

## Map Rolling

Map(waystone) rolling is a preset widget that helps to match maps with certain mods on them.

![Map rolling](/reference-images/StashSearchMapRolling.png)

Clicking any of these buttons will paste the text into the search bar in the stash or vendor window. For example, clicking "Burning Ground" will paste the text `"Burning Ground"` in the stash search bar. This will then highlight any map(waystone) that has that mod on it. In this case, those could be highlighted and then vendored if you don't want to deal with burning ground.

![Stash Search burning ground](/reference-images/MapRollingBurning.png)

Here is what this looks like in settings for the widget.

![Stash Search settings](/reference-images/StashSearchRollingSettings.png)

## Dump Sorting

Dump sorting is a preset widget that helps to highlight certain items, particularly useful when going through a dump tab after mapping.

![Dump sorting](/reference-images/DumpSortWidget.png)

Clicking any of these buttons will paste the text into the search bar in the stash or vendor window. Example of searching for currency in a dump tab. This will then highlight any item that contains "currency" in it's description.

![Dump search currency](/reference-images/DumpSortCurrency.png)

And it's settings.

![Dump search settings](/reference-images/DumpSortSettings.png)

## More Complex Example

Here is a bit more of a complex example of how the stash search can be setup and used.

This is using a complex regex to search for maps that do not have certain mods, "Burning Ground" and "Monsters penetrate #% Elemental Resistances". Along with that it also ensures the map is Tier 15+ and has more than 250% waystone drop chance.

![Stash search example](/reference-images/DefaultMapRollSearch.png)

In these settings, the actual regex is shown. It is quite unreadable and thus all of these use "Friendly Names", basically flavor text that is displayed in place of the actual used regex. Using this can make it easier to remember what each button does.

The bottom one is most commonly used so it has been assigned a hotkey for convenience, `F2`. When in the stash, just pressing `F2` will automatically perform that search without even opening the overlay. This is especially useful for searching vendors for items after leveling up.

![Stash search example settings](/reference-images/StashSearchSettings2.png)

The hotkey is also visible in the overlay when it is opened, and can toggle all the hotkeys for the widget on and off with the switch in the top right of the widget.

![Stash search example hotkey](/reference-images/RollingMain.png)

## Settings

Inside the settings of the widget, each saved search can be edited, deleted, moved around, be given an alias, and have hotkeys assigned to them.
